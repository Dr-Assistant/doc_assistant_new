const voiceRecordingService = require('../services/voiceRecording.service');
const audioValidationService = require('../services/audioValidation.service');
const retentionService = require('../services/retention.service');
const { logger } = require('../utils/logger');
const { ValidationError } = require('../utils/error-handler');

/**
 * Upload and create a new voice recording
 */
const createVoiceRecording = async (req, res, next) => {
  try {
    const { encounterId, patientId, doctorId, duration, deviceInfo, retentionReason, retentionDays } = req.body;
    
    // Validate required fields
    if (!encounterId || !patientId || !duration) {
      throw new ValidationError('encounterId, patientId, and duration are required');
    }

    if (!req.fileInfo || !req.fileInfo.buffer) {
      throw new ValidationError('Audio file is required');
    }

    // Prepare recording data
    const recordingData = {
      encounterId,
      patientId,
      doctorId: doctorId || req.user.id,
      duration: parseFloat(duration),
      deviceInfo,
      retentionReason,
      retentionDays: retentionDays ? parseInt(retentionDays) : null,
      originalFileName: req.fileInfo.originalName,
      mimeType: req.fileInfo.mimeType
    };

    // Get request info for audit trail
    const requestInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Create voice recording
    const recording = await voiceRecordingService.createVoiceRecording(
      recordingData,
      req.fileInfo.buffer,
      req.user,
      requestInfo
    );

    logger.info('Voice recording created via API', {
      recordingId: recording._id,
      userId: req.user.id,
      encounterId: encounterId,
      fileSize: req.fileInfo.size
    });

    res.status(201).json({
      success: true,
      data: {
        recording: recording
      },
      message: 'Voice recording uploaded successfully'
    });
  } catch (error) {
    logger.error('Create voice recording failed:', error);
    next(error);
  }
};

/**
 * Get voice recording by ID
 */
const getVoiceRecording = async (req, res, next) => {
  try {
    const { recordingId } = req.params;
    
    const recording = await voiceRecordingService.getVoiceRecording(recordingId, req.user);

    res.json({
      success: true,
      data: {
        recording: recording
      }
    });
  } catch (error) {
    logger.error('Get voice recording failed:', error);
    next(error);
  }
};

/**
 * Get voice recordings for an encounter
 */
const getRecordingsByEncounter = async (req, res, next) => {
  try {
    const { encounterId } = req.params;
    
    const recordings = await voiceRecordingService.getRecordingsByEncounter(encounterId, req.user);

    res.json({
      success: true,
      data: {
        recordings: recordings,
        count: recordings.length
      }
    });
  } catch (error) {
    logger.error('Get recordings by encounter failed:', error);
    next(error);
  }
};

/**
 * Update voice recording status
 */
const updateRecordingStatus = async (req, res, next) => {
  try {
    const { recordingId } = req.params;
    const { status, transcriptionId, processingStats } = req.body;
    
    if (!status) {
      throw new ValidationError('Status is required');
    }

    const updateData = {};
    if (transcriptionId) updateData.transcriptionId = transcriptionId;
    if (processingStats) updateData.processingStats = processingStats;

    const recording = await voiceRecordingService.updateRecordingStatus(
      recordingId,
      status,
      updateData,
      req.user
    );

    res.json({
      success: true,
      data: {
        recording: recording
      },
      message: 'Recording status updated successfully'
    });
  } catch (error) {
    logger.error('Update recording status failed:', error);
    next(error);
  }
};

/**
 * Delete voice recording
 */
const deleteVoiceRecording = async (req, res, next) => {
  try {
    const { recordingId } = req.params;
    
    await voiceRecordingService.deleteVoiceRecording(recordingId, req.user);

    res.json({
      success: true,
      message: 'Voice recording deleted successfully'
    });
  } catch (error) {
    logger.error('Delete voice recording failed:', error);
    next(error);
  }
};

/**
 * Download audio file
 */
const downloadAudioFile = async (req, res, next) => {
  try {
    const { recordingId } = req.params;
    
    const audioData = await voiceRecordingService.getAudioFile(recordingId, req.user);

    // Set response headers
    res.set({
      'Content-Type': audioData.mimeType,
      'Content-Length': audioData.size,
      'Content-Disposition': `attachment; filename="${audioData.filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.send(audioData.buffer);
  } catch (error) {
    logger.error('Download audio file failed:', error);
    next(error);
  }
};

/**
 * Get audio validation limits and supported formats
 */
const getValidationInfo = async (req, res, next) => {
  try {
    const limits = audioValidationService.getValidationLimits();
    const formats = audioValidationService.getSupportedFormats();

    res.json({
      success: true,
      data: {
        limits: limits,
        supportedFormats: formats
      }
    });
  } catch (error) {
    logger.error('Get validation info failed:', error);
    next(error);
  }
};

/**
 * Get retention statistics (admin only)
 */
const getRetentionStatistics = async (req, res, next) => {
  try {
    const stats = await retentionService.getRetentionStatistics();

    res.json({
      success: true,
      data: {
        statistics: stats
      }
    });
  } catch (error) {
    logger.error('Get retention statistics failed:', error);
    next(error);
  }
};

/**
 * Cleanup expired recordings (admin only)
 */
const cleanupExpiredRecordings = async (req, res, next) => {
  try {
    const { dryRun = false } = req.query;
    
    const results = await retentionService.cleanupExpiredRecordings(dryRun === 'true');

    res.json({
      success: true,
      data: {
        results: results
      },
      message: dryRun === 'true' ? 'Dry run completed' : 'Cleanup completed'
    });
  } catch (error) {
    logger.error('Cleanup expired recordings failed:', error);
    next(error);
  }
};

/**
 * Update retention policy for a recording
 */
const updateRetentionPolicy = async (req, res, next) => {
  try {
    const { recordingId } = req.params;
    const { reason, customDays } = req.body;
    
    if (!reason) {
      throw new ValidationError('Retention reason is required');
    }

    const recording = await retentionService.updateRetentionPolicy(
      recordingId,
      reason,
      customDays ? parseInt(customDays) : null
    );

    res.json({
      success: true,
      data: {
        recording: recording.toSafeObject()
      },
      message: 'Retention policy updated successfully'
    });
  } catch (error) {
    logger.error('Update retention policy failed:', error);
    next(error);
  }
};

/**
 * Extend retention period for a recording
 */
const extendRetention = async (req, res, next) => {
  try {
    const { recordingId } = req.params;
    const { additionalDays } = req.body;
    
    if (!additionalDays || additionalDays <= 0) {
      throw new ValidationError('Additional days must be a positive number');
    }

    const recording = await retentionService.extendRetention(
      recordingId,
      parseInt(additionalDays)
    );

    res.json({
      success: true,
      data: {
        recording: recording.toSafeObject()
      },
      message: 'Retention period extended successfully'
    });
  } catch (error) {
    logger.error('Extend retention failed:', error);
    next(error);
  }
};

module.exports = {
  createVoiceRecording,
  getVoiceRecording,
  getRecordingsByEncounter,
  updateRecordingStatus,
  deleteVoiceRecording,
  downloadAudioFile,
  getValidationInfo,
  getRetentionStatistics,
  cleanupExpiredRecordings,
  updateRetentionPolicy,
  extendRetention
};
