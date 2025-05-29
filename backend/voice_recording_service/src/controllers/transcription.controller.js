const transcriptionService = require('../services/transcription.service');
const voiceRecordingService = require('../services/voiceRecording.service');
const { logger } = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/error-handler');

class TranscriptionController {
  /**
   * Create and start transcription for a voice recording
   * @route POST /api/transcriptions
   */
  async createTranscription(req, res, next) {
    try {
      const { voiceRecordingId, options = {} } = req.body;

      logger.info('Creating transcription', {
        voiceRecordingId,
        userId: req.user.id,
        options
      });

      // Get voice recording
      const voiceRecording = await voiceRecordingService.getVoiceRecordingById(voiceRecordingId);
      if (!voiceRecording) {
        throw new NotFoundError('Voice recording not found');
      }

      // Check if user has access to this recording
      if (voiceRecording.doctorId !== req.user.id && req.user.role !== 'admin') {
        throw new ValidationError('Access denied to this voice recording');
      }

      // Check if transcription already exists
      const existingTranscription = await transcriptionService.getTranscriptionByVoiceRecording(voiceRecordingId);
      if (existingTranscription) {
        return res.status(200).json({
          success: true,
          message: 'Transcription already exists',
          data: existingTranscription
        });
      }

      // Create transcription
      const transcription = await transcriptionService.createTranscription(voiceRecording, options);

      // Start processing asynchronously
      setImmediate(async () => {
        try {
          const duration = voiceRecording.duration || 0;
          if (duration > 60) { // Use long-running for audio > 1 minute
            await transcriptionService.processLongRunningTranscription(transcription);
          } else {
            await transcriptionService.processTranscription(transcription);
          }
        } catch (error) {
          logger.error('Async transcription processing failed', {
            transcriptionId: transcription._id,
            error: error.message
          });
        }
      });

      res.status(201).json({
        success: true,
        message: 'Transcription job created and processing started',
        data: transcription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transcription by ID
   * @route GET /api/transcriptions/:transcriptionId
   */
  async getTranscription(req, res, next) {
    try {
      const { transcriptionId } = req.params;

      logger.info('Getting transcription', {
        transcriptionId,
        userId: req.user.id
      });

      const transcription = await transcriptionService.getTranscriptionByVoiceRecording(transcriptionId);
      if (!transcription) {
        throw new NotFoundError('Transcription not found');
      }

      // Check access
      if (transcription.doctorId !== req.user.id && req.user.role !== 'admin') {
        throw new ValidationError('Access denied to this transcription');
      }

      res.status(200).json({
        success: true,
        data: transcription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transcription by voice recording ID
   * @route GET /api/transcriptions/voice-recording/:voiceRecordingId
   */
  async getTranscriptionByVoiceRecording(req, res, next) {
    try {
      const { voiceRecordingId } = req.params;

      logger.info('Getting transcription by voice recording', {
        voiceRecordingId,
        userId: req.user.id
      });

      const transcription = await transcriptionService.getTranscriptionByVoiceRecording(voiceRecordingId);
      if (!transcription) {
        throw new NotFoundError('Transcription not found for this voice recording');
      }

      // Check access
      if (transcription.doctorId !== req.user.id && req.user.role !== 'admin') {
        throw new ValidationError('Access denied to this transcription');
      }

      res.status(200).json({
        success: true,
        data: transcription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transcriptions by encounter ID
   * @route GET /api/transcriptions/encounter/:encounterId
   */
  async getTransriptionsByEncounter(req, res, next) {
    try {
      const { encounterId } = req.params;

      logger.info('Getting transcriptions by encounter', {
        encounterId,
        userId: req.user.id
      });

      const transcriptions = await transcriptionService.getTranscriptionsByEncounter(encounterId);

      // Filter by doctor access
      const accessibleTranscriptions = transcriptions.filter(t =>
        t.doctorId === req.user.id || req.user.role === 'admin'
      );

      res.status(200).json({
        success: true,
        data: accessibleTranscriptions,
        count: accessibleTranscriptions.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retry failed transcription
   * @route POST /api/transcriptions/:transcriptionId/retry
   */
  async retryTranscription(req, res, next) {
    try {
      const { transcriptionId } = req.params;

      logger.info('Retrying transcription', {
        transcriptionId,
        userId: req.user.id
      });

      const transcription = await transcriptionService.retryTranscription(transcriptionId);

      res.status(200).json({
        success: true,
        message: 'Transcription retry initiated',
        data: transcription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transcription statistics
   * @route GET /api/transcriptions/stats
   */
  async getTranscriptionStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const doctorId = req.user.role === 'admin' ? req.query.doctorId : req.user.id;

      logger.info('Getting transcription statistics', {
        doctorId,
        startDate,
        endDate,
        userId: req.user.id
      });

      const stats = await transcriptionService.getTranscriptionStats(
        doctorId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending transcriptions (admin only)
   * @route GET /api/transcriptions/pending
   */
  async getPendingTranscriptions(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        throw new ValidationError('Admin access required');
      }

      logger.info('Getting pending transcriptions', {
        userId: req.user.id
      });

      const pendingTranscriptions = await transcriptionService.getPendingTranscriptions();

      res.status(200).json({
        success: true,
        data: pendingTranscriptions,
        count: pendingTranscriptions.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process pending transcriptions (admin only)
   * @route POST /api/transcriptions/process-pending
   */
  async processPendingTranscriptions(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        throw new ValidationError('Admin access required');
      }

      logger.info('Processing pending transcriptions', {
        userId: req.user.id
      });

      const pendingTranscriptions = await transcriptionService.getPendingTranscriptions();
      const processedCount = pendingTranscriptions.length;

      // Process each pending transcription asynchronously
      pendingTranscriptions.forEach(async (transcription) => {
        try {
          const duration = transcription.duration || 0;
          if (duration > 60) {
            await transcriptionService.processLongRunningTranscription(transcription);
          } else {
            await transcriptionService.processTranscription(transcription);
          }
        } catch (error) {
          logger.error('Failed to process pending transcription', {
            transcriptionId: transcription._id,
            error: error.message
          });
        }
      });

      res.status(200).json({
        success: true,
        message: `Processing ${processedCount} pending transcriptions`,
        data: {
          processedCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update transcription metadata
   * @route PUT /api/transcriptions/:transcriptionId/metadata
   */
  async updateTranscriptionMetadata(req, res, next) {
    try {
      const { transcriptionId } = req.params;
      const { metadata } = req.body;

      logger.info('Updating transcription metadata', {
        transcriptionId,
        userId: req.user.id
      });

      // This would be implemented based on specific requirements
      // For now, return a placeholder response
      res.status(200).json({
        success: true,
        message: 'Transcription metadata update not yet implemented',
        data: { transcriptionId, metadata }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete transcription
   * @route DELETE /api/transcriptions/:transcriptionId
   */
  async deleteTranscription(req, res, next) {
    try {
      const { transcriptionId } = req.params;

      logger.info('Deleting transcription', {
        transcriptionId,
        userId: req.user.id
      });

      // This would be implemented based on specific requirements
      // For now, return a placeholder response
      res.status(200).json({
        success: true,
        message: 'Transcription deletion not yet implemented',
        data: { transcriptionId }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TranscriptionController();
