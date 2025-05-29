const express = require('express');
const router = express.Router();

// Middleware
const { verifyToken, requireDoctor, requireAdmin } = require('../middleware/auth.middleware');
const { uploadLimiter, generalLimiter } = require('../middleware/rateLimit.middleware');
const {
  uploadSingle,
  handleUploadErrors,
  validateUploadedFile
} = require('../middleware/upload.middleware');

// Controllers
const voiceRecordingController = require('../controllers/voiceRecording.controller');

// Validation middleware
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');

/**
 * @route POST /api/voice-recordings
 * @desc Upload and create a new voice recording
 * @access Private (Doctor)
 */
router.post('/',
  uploadLimiter, // Rate limiting for uploads
  verifyToken,
  requireDoctor,
  uploadSingle,
  handleUploadErrors,
  validateUploadedFile,
  [
    body('encounterId')
      .isUUID()
      .withMessage('Encounter ID must be a valid UUID'),
    body('patientId')
      .isUUID()
      .withMessage('Patient ID must be a valid UUID'),
    body('doctorId')
      .optional()
      .isUUID()
      .withMessage('Doctor ID must be a valid UUID'),
    body('duration')
      .isFloat({ min: 1, max: 3600 })
      .withMessage('Duration must be between 1 and 3600 seconds'),
    body('deviceInfo')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Device info must be less than 255 characters'),
    body('retentionReason')
      .optional()
      .isIn(['clinical', 'legal', 'research', 'audit'])
      .withMessage('Invalid retention reason'),
    body('retentionDays')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Retention days must be between 1 and 365')
  ],
  validate,
  voiceRecordingController.createVoiceRecording
);

/**
 * @route GET /api/voice-recordings/:recordingId
 * @desc Get voice recording by ID
 * @access Private (Doctor)
 */
router.get('/:recordingId',
  verifyToken,
  requireDoctor,
  [
    param('recordingId')
      .isMongoId()
      .withMessage('Recording ID must be a valid MongoDB ObjectId')
  ],
  validate,
  voiceRecordingController.getVoiceRecording
);

/**
 * @route GET /api/voice-recordings/encounter/:encounterId
 * @desc Get voice recordings for an encounter
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
  voiceRecordingController.getRecordingsByEncounter
);

/**
 * @route PUT /api/voice-recordings/:recordingId/status
 * @desc Update voice recording status
 * @access Private (Doctor)
 */
router.put('/:recordingId/status',
  verifyToken,
  requireDoctor,
  [
    param('recordingId')
      .isMongoId()
      .withMessage('Recording ID must be a valid MongoDB ObjectId'),
    body('status')
      .isIn(['uploading', 'processing', 'transcribed', 'error', 'deleted'])
      .withMessage('Invalid status'),
    body('transcriptionId')
      .optional()
      .isMongoId()
      .withMessage('Transcription ID must be a valid MongoDB ObjectId'),
    body('processingStats')
      .optional()
      .isObject()
      .withMessage('Processing stats must be an object'),
    body('processingStats.transcriptionTime')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Transcription time must be a positive number'),
    body('processingStats.wordCount')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Word count must be a positive integer'),
    body('processingStats.confidence')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Confidence must be between 0 and 1')
  ],
  validate,
  voiceRecordingController.updateRecordingStatus
);

/**
 * @route DELETE /api/voice-recordings/:recordingId
 * @desc Delete voice recording
 * @access Private (Doctor)
 */
router.delete('/:recordingId',
  verifyToken,
  requireDoctor,
  [
    param('recordingId')
      .isMongoId()
      .withMessage('Recording ID must be a valid MongoDB ObjectId')
  ],
  validate,
  voiceRecordingController.deleteVoiceRecording
);

/**
 * @route GET /api/voice-recordings/:recordingId/download
 * @desc Download audio file
 * @access Private (Doctor)
 */
router.get('/:recordingId/download',
  generalLimiter, // Rate limiting for downloads
  verifyToken,
  requireDoctor,
  [
    param('recordingId')
      .isMongoId()
      .withMessage('Recording ID must be a valid MongoDB ObjectId')
  ],
  validate,
  voiceRecordingController.downloadAudioFile
);

/**
 * @route GET /api/voice-recordings/validation/info
 * @desc Get audio validation limits and supported formats
 * @access Private (Doctor)
 */
router.get('/validation/info',
  verifyToken,
  requireDoctor,
  voiceRecordingController.getValidationInfo
);

/**
 * @route PUT /api/voice-recordings/:recordingId/retention
 * @desc Update retention policy for a recording
 * @access Private (Doctor)
 */
router.put('/:recordingId/retention',
  verifyToken,
  requireDoctor,
  [
    param('recordingId')
      .isMongoId()
      .withMessage('Recording ID must be a valid MongoDB ObjectId'),
    body('reason')
      .isIn(['clinical', 'legal', 'research', 'audit'])
      .withMessage('Invalid retention reason'),
    body('customDays')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Custom days must be between 1 and 365')
  ],
  validate,
  voiceRecordingController.updateRetentionPolicy
);

/**
 * @route PUT /api/voice-recordings/:recordingId/extend-retention
 * @desc Extend retention period for a recording
 * @access Private (Doctor)
 */
router.put('/:recordingId/extend-retention',
  verifyToken,
  requireDoctor,
  [
    param('recordingId')
      .isMongoId()
      .withMessage('Recording ID must be a valid MongoDB ObjectId'),
    body('additionalDays')
      .isInt({ min: 1, max: 365 })
      .withMessage('Additional days must be between 1 and 365')
  ],
  validate,
  voiceRecordingController.extendRetention
);

// Admin-only routes
/**
 * @route GET /api/voice-recordings/admin/retention/statistics
 * @desc Get retention statistics
 * @access Private (Admin)
 */
router.get('/admin/retention/statistics',
  verifyToken,
  requireAdmin,
  voiceRecordingController.getRetentionStatistics
);

/**
 * @route POST /api/voice-recordings/admin/retention/cleanup
 * @desc Cleanup expired recordings
 * @access Private (Admin)
 */
router.post('/admin/retention/cleanup',
  verifyToken,
  requireAdmin,
  [
    query('dryRun')
      .optional()
      .isBoolean()
      .withMessage('Dry run must be a boolean')
  ],
  validate,
  voiceRecordingController.cleanupExpiredRecordings
);

module.exports = router;
