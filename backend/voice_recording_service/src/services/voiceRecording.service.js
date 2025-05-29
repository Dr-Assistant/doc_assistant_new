const VoiceRecording = require('../models/VoiceRecording');
const audioValidationService = require('./audioValidation.service');
const audioStorageService = require('./audioStorage.service');
const retentionService = require('./retention.service');
const { logger } = require('../utils/logger');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError
} = require('../utils/error-handler');

class VoiceRecordingService {
  /**
   * Create a new voice recording
   * @param {Object} recordingData - Recording data
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {Object} user - User information
   * @param {Object} requestInfo - Request information (IP, user agent)
   * @returns {Promise<Object>} Created recording
   */
  async createVoiceRecording(recordingData, audioBuffer, user, requestInfo = {}) {
    try {
      // Validate input data
      this.validateRecordingData(recordingData);

      // Validate audio file
      const validation = await audioValidationService.validateAudioFile(
        audioBuffer,
        { duration: recordingData.duration }
      );

      if (!validation.isValid) {
        throw new ValidationError(`Audio validation failed: ${validation.errors.join(', ')}`);
      }

      // Store audio file with encryption
      const storageResult = await audioStorageService.storeAudioFile(audioBuffer, {
        ...recordingData,
        uploadedBy: user.id,
        originalFileName: recordingData.originalFileName
      });

      // Calculate retention policy
      const retentionPolicy = retentionService.calculateRetentionPolicy(
        recordingData.retentionReason || 'clinical',
        recordingData.retentionDays
      );

      // Create voice recording document
      const voiceRecording = new VoiceRecording({
        encounterId: recordingData.encounterId,
        patientId: recordingData.patientId,
        doctorId: recordingData.doctorId || user.id,
        duration: recordingData.duration,
        fileSize: audioBuffer.length,
        mimeType: validation.fileInfo.mimeType,
        status: 'processing',
        fileId: storageResult.fileId,
        encryption: storageResult.encryption,
        checksum: storageResult.checksum,
        metadata: {
          deviceInfo: recordingData.deviceInfo,
          quality: validation.quality,
          originalFileName: recordingData.originalFileName,
          uploadedBy: user.id,
          ipAddress: requestInfo.ip,
          userAgent: requestInfo.userAgent
        },
        retentionPolicy: retentionPolicy
      });

      await voiceRecording.save();

      logger.info('Voice recording created successfully', {
        recordingId: voiceRecording._id,
        encounterId: recordingData.encounterId,
        patientId: recordingData.patientId,
        doctorId: user.id,
        fileSize: audioBuffer.length,
        duration: recordingData.duration,
        quality: validation.quality
      });

      // Trigger transcription automatically if enabled
      if (process.env.AUTO_TRANSCRIBE_RECORDINGS !== 'false') {
        setImmediate(async () => {
          try {
            const transcriptionService = require('./transcription.service');
            await transcriptionService.createTranscription(voiceRecording);

            // Start processing based on duration
            const transcription = await transcriptionService.getTranscriptionByVoiceRecording(voiceRecording._id);
            if (transcription) {
              if (recordingData.duration > 60) {
                await transcriptionService.processLongRunningTranscription(transcription);
              } else {
                await transcriptionService.processTranscription(transcription);
              }
            }
          } catch (error) {
            logger.error('Failed to auto-transcribe recording', {
              recordingId: voiceRecording._id,
              error: error.message
            });
          }
        });
      }

      return voiceRecording.toSafeObject();
    } catch (error) {
      logger.error('Failed to create voice recording:', error);
      throw error;
    }
  }

  /**
   * Get voice recording by ID
   * @param {string} recordingId - Recording ID
   * @param {Object} user - User information
   * @returns {Promise<Object>} Voice recording
   */
  async getVoiceRecording(recordingId, user) {
    try {
      const recording = await VoiceRecording.findById(recordingId);

      if (!recording) {
        throw new NotFoundError('Voice recording not found');
      }

      // Check authorization
      if (!this.canAccessRecording(recording, user)) {
        throw new AuthorizationError('Access denied to this recording');
      }

      return recording.toSafeObject();
    } catch (error) {
      logger.error('Failed to get voice recording:', error);
      throw error;
    }
  }

  /**
   * Get voice recordings for an encounter
   * @param {string} encounterId - Encounter ID
   * @param {Object} user - User information
   * @returns {Promise<Array>} Voice recordings
   */
  async getRecordingsByEncounter(encounterId, user) {
    try {
      const recordings = await VoiceRecording.findByEncounter(encounterId);

      // Filter recordings based on user access
      const accessibleRecordings = recordings.filter(recording =>
        this.canAccessRecording(recording, user)
      );

      return accessibleRecordings.map(recording => recording.toSafeObject());
    } catch (error) {
      logger.error('Failed to get recordings by encounter:', error);
      throw error;
    }
  }

  /**
   * Update voice recording status
   * @param {string} recordingId - Recording ID
   * @param {string} status - New status
   * @param {Object} updateData - Additional update data
   * @param {Object} user - User information
   * @returns {Promise<Object>} Updated recording
   */
  async updateRecordingStatus(recordingId, status, updateData = {}, user) {
    try {
      const recording = await VoiceRecording.findById(recordingId);

      if (!recording) {
        throw new NotFoundError('Voice recording not found');
      }

      // Check authorization
      if (!this.canModifyRecording(recording, user)) {
        throw new AuthorizationError('Access denied to modify this recording');
      }

      // Validate status transition
      if (!this.isValidStatusTransition(recording.status, status)) {
        throw new ValidationError(`Invalid status transition from ${recording.status} to ${status}`);
      }

      // Update recording
      recording.status = status;

      if (updateData.transcriptionId) {
        recording.transcriptionId = updateData.transcriptionId;
      }

      if (updateData.processingStats) {
        recording.metadata.processingStats = updateData.processingStats;
      }

      await recording.save();

      logger.info('Voice recording status updated', {
        recordingId: recordingId,
        oldStatus: recording.status,
        newStatus: status,
        updatedBy: user.id
      });

      return recording.toSafeObject();
    } catch (error) {
      logger.error('Failed to update recording status:', error);
      throw error;
    }
  }

  /**
   * Delete voice recording
   * @param {string} recordingId - Recording ID
   * @param {Object} user - User information
   * @returns {Promise<boolean>} Success status
   */
  async deleteVoiceRecording(recordingId, user) {
    try {
      const recording = await VoiceRecording.findById(recordingId);

      if (!recording) {
        throw new NotFoundError('Voice recording not found');
      }

      // Check authorization
      if (!this.canDeleteRecording(recording, user)) {
        throw new AuthorizationError('Access denied to delete this recording');
      }

      // Check if recording can be deleted
      if (!recording.canBeDeleted()) {
        throw new ConflictError('Recording cannot be deleted in current status');
      }

      // Delete audio file from storage
      await audioStorageService.deleteAudioFile(recording.fileId);

      // Mark recording as deleted
      recording.status = 'deleted';
      await recording.save();

      logger.info('Voice recording deleted', {
        recordingId: recordingId,
        deletedBy: user.id
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete voice recording:', error);
      throw error;
    }
  }

  /**
   * Get audio file stream
   * @param {string} recordingId - Recording ID
   * @param {Object} user - User information
   * @returns {Promise<Object>} Audio file data
   */
  async getAudioFile(recordingId, user) {
    try {
      const recording = await VoiceRecording.findById(recordingId);

      if (!recording) {
        throw new NotFoundError('Voice recording not found');
      }

      // Check authorization
      if (!this.canAccessRecording(recording, user)) {
        throw new AuthorizationError('Access denied to this recording');
      }

      // Retrieve encrypted audio file
      const audioData = await audioStorageService.retrieveAudioFile(recording.fileId);

      // Decrypt audio file
      const decryptedBuffer = audioStorageService.decryptAudioBuffer(
        audioData.encryptedBuffer,
        recording.encryption
      );

      return {
        buffer: decryptedBuffer,
        mimeType: recording.mimeType,
        filename: `recording_${recordingId}.${this.getFileExtension(recording.mimeType)}`,
        size: recording.fileSize
      };
    } catch (error) {
      logger.error('Failed to get audio file:', error);
      throw error;
    }
  }

  /**
   * Validate recording data
   * @param {Object} data - Recording data to validate
   */
  validateRecordingData(data) {
    const required = ['encounterId', 'patientId', 'duration'];

    for (const field of required) {
      if (!data[field]) {
        throw new ValidationError(`${field} is required`);
      }
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(data.encounterId)) {
      throw new ValidationError('Invalid encounter ID format');
    }

    if (!uuidRegex.test(data.patientId)) {
      throw new ValidationError('Invalid patient ID format');
    }

    if (data.doctorId && !uuidRegex.test(data.doctorId)) {
      throw new ValidationError('Invalid doctor ID format');
    }

    // Validate duration
    if (typeof data.duration !== 'number' || data.duration <= 0) {
      throw new ValidationError('Duration must be a positive number');
    }
  }

  /**
   * Check if user can access recording
   * @param {Object} recording - Voice recording
   * @param {Object} user - User information
   * @returns {boolean} Access permission
   */
  canAccessRecording(recording, user) {
    // Doctor can access their own recordings
    if (recording.doctorId === user.id) {
      return true;
    }

    // Admin can access all recordings
    if (user.role === 'admin') {
      return true;
    }

    // Additional access rules can be added here
    return false;
  }

  /**
   * Check if user can modify recording
   * @param {Object} recording - Voice recording
   * @param {Object} user - User information
   * @returns {boolean} Modify permission
   */
  canModifyRecording(recording, user) {
    return this.canAccessRecording(recording, user);
  }

  /**
   * Check if user can delete recording
   * @param {Object} recording - Voice recording
   * @param {Object} user - User information
   * @returns {boolean} Delete permission
   */
  canDeleteRecording(recording, user) {
    // Only the doctor who created the recording or admin can delete
    return recording.doctorId === user.id || user.role === 'admin';
  }

  /**
   * Check if status transition is valid
   * @param {string} currentStatus - Current status
   * @param {string} newStatus - New status
   * @returns {boolean} Valid transition
   */
  isValidStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'uploading': ['processing', 'error'],
      'processing': ['transcribed', 'error'],
      'transcribed': ['error'],
      'error': ['processing'],
      'deleted': []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Get file extension from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string} File extension
   */
  getFileExtension(mimeType) {
    const extensions = {
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/mp4': 'mp4',
      'audio/webm': 'webm',
      'audio/ogg': 'ogg'
    };

    return extensions[mimeType] || 'audio';
  }
}

module.exports = new VoiceRecordingService();
