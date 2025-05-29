const express = require('express');
const { body, param, query } = require('express-validator');
const transcriptionController = require('../controllers/transcription.controller');
const { verifyToken, requireDoctor, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { transcriptionLimiter, generalLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

/**
 * @route POST /api/transcriptions
 * @desc Create and start transcription for a voice recording
 * @access Private (Doctor)
 */
router.post('/',
  transcriptionLimiter, // Rate limiting for transcription requests
  verifyToken,
  requireDoctor,
  [
    body('voiceRecordingId')
      .isMongoId()
      .withMessage('Voice recording ID must be a valid MongoDB ObjectId'),
    body('options')
      .optional()
      .isObject()
      .withMessage('Options must be an object'),
    body('options.languageCode')
      .optional()
      .isString()
      .isLength({ min: 2, max: 10 })
      .withMessage('Language code must be a valid language code'),
    body('options.enableSpeakerDiarization')
      .optional()
      .isBoolean()
      .withMessage('Enable speaker diarization must be a boolean'),
    body('options.speakerCount')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Speaker count must be between 1 and 10'),
    body('options.model')
      .optional()
      .isIn(['latest_long', 'latest_short', 'command_and_search', 'phone_call', 'video', 'default'])
      .withMessage('Invalid transcription model')
  ],
  validate,
  transcriptionController.createTranscription
);

/**
 * @route GET /api/transcriptions/stats
 * @desc Get transcription statistics
 * @access Private (Doctor)
 */
router.get('/stats',
  verifyToken,
  requireDoctor,
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('doctorId')
      .optional()
      .isUUID()
      .withMessage('Doctor ID must be a valid UUID')
  ],
  validate,
  transcriptionController.getTranscriptionStats
);

/**
 * @route GET /api/transcriptions/:transcriptionId
 * @desc Get transcription by ID
 * @access Private (Doctor)
 */
router.get('/:transcriptionId',
  verifyToken,
  requireDoctor,
  [
    param('transcriptionId')
      .isMongoId()
      .withMessage('Transcription ID must be a valid MongoDB ObjectId')
  ],
  validate,
  transcriptionController.getTranscription
);

/**
 * @route GET /api/transcriptions/voice-recording/:voiceRecordingId
 * @desc Get transcription by voice recording ID
 * @access Private (Doctor)
 */
router.get('/voice-recording/:voiceRecordingId',
  verifyToken,
  requireDoctor,
  [
    param('voiceRecordingId')
      .isMongoId()
      .withMessage('Voice recording ID must be a valid MongoDB ObjectId')
  ],
  validate,
  transcriptionController.getTranscriptionByVoiceRecording
);

/**
 * @route GET /api/transcriptions/encounter/:encounterId
 * @desc Get transcriptions by encounter ID
 * @access Private (Doctor)
 */
router.get('/encounter/:encounterId',
  verifyToken,
  requireDoctor,
  [
    param('encounterId')
      .isUUID()
      .withMessage('Encounter ID must be a valid UUID')
  ],
  validate,
  transcriptionController.getTransriptionsByEncounter
);

/**
 * @route POST /api/transcriptions/:transcriptionId/retry
 * @desc Retry failed transcription
 * @access Private (Doctor)
 */
router.post('/:transcriptionId/retry',
  transcriptionLimiter, // Rate limiting for retry requests
  verifyToken,
  requireDoctor,
  [
    param('transcriptionId')
      .isMongoId()
      .withMessage('Transcription ID must be a valid MongoDB ObjectId')
  ],
  validate,
  transcriptionController.retryTranscription
);



/**
 * @route PUT /api/transcriptions/:transcriptionId/metadata
 * @desc Update transcription metadata
 * @access Private (Doctor)
 */
router.put('/:transcriptionId/metadata',
  verifyToken,
  requireDoctor,
  [
    param('transcriptionId')
      .isMongoId()
      .withMessage('Transcription ID must be a valid MongoDB ObjectId'),
    body('metadata')
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  validate,
  transcriptionController.updateTranscriptionMetadata
);

// Admin-only routes
/**
 * @route GET /api/transcriptions/admin/pending
 * @desc Get pending transcriptions
 * @access Private (Admin)
 */
router.get('/admin/pending',
  verifyToken,
  requireAdmin,
  transcriptionController.getPendingTranscriptions
);

/**
 * @route POST /api/transcriptions/admin/process-pending
 * @desc Process all pending transcriptions
 * @access Private (Admin)
 */
router.post('/admin/process-pending',
  generalLimiter, // Rate limiting for admin requests
  verifyToken,
  requireAdmin,
  transcriptionController.processPendingTranscriptions
);

/**
 * @route DELETE /api/transcriptions/:transcriptionId
 * @desc Delete transcription
 * @access Private (Admin)
 */
router.delete('/:transcriptionId',
  verifyToken,
  requireAdmin,
  [
    param('transcriptionId')
      .isMongoId()
      .withMessage('Transcription ID must be a valid MongoDB ObjectId')
  ],
  validate,
  transcriptionController.deleteTranscription
);

module.exports = router;
