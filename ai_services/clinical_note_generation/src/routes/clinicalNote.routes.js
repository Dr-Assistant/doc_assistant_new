const express = require('express');
const { body, param, query } = require('express-validator');
const clinicalNoteController = require('../controllers/clinicalNote.controller');
const { verifyToken, requireDoctor, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { aiGenerationRateLimit, defaultRateLimit } = require('../middleware/rateLimit.middleware');

const router = express.Router();

/**
 * @route POST /api/clinical-notes/generate
 * @desc Generate clinical note from transcription
 * @access Private (Doctor)
 */
router.post('/generate',
  aiGenerationRateLimit,
  verifyToken,
  requireDoctor,
  [
    body('transcriptionId')
      .isMongoId()
      .withMessage('Transcription ID must be a valid MongoDB ObjectId'),
    body('context')
      .optional()
      .isObject()
      .withMessage('Context must be an object'),
    body('context.noteType')
      .optional()
      .isIn(['soap', 'progress', 'procedure', 'discharge', 'referral', 'consultation', 'follow-up'])
      .withMessage('Invalid note type'),
    body('context.priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('Invalid priority level'),
    body('context.specialty')
      .optional()
      .isString()
      .isLength({ min: 2, max: 100 })
      .withMessage('Specialty must be between 2 and 100 characters')
  ],
  validate,
  clinicalNoteController.generateClinicalNote
);

/**
 * @route GET /api/clinical-notes/:clinicalNoteId
 * @desc Get clinical note by ID
 * @access Private (Doctor)
 */
router.get('/:clinicalNoteId',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('clinicalNoteId')
      .isMongoId()
      .withMessage('Clinical note ID must be a valid MongoDB ObjectId')
  ],
  validate,
  clinicalNoteController.getClinicalNote
);

/**
 * @route GET /api/clinical-notes/encounter/:encounterId
 * @desc Get clinical note by encounter ID
 * @access Private (Doctor)
 */
router.get('/encounter/:encounterId',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('encounterId')
      .isUUID()
      .withMessage('Encounter ID must be a valid UUID')
  ],
  validate,
  clinicalNoteController.getClinicalNoteByEncounter
);

/**
 * @route PUT /api/clinical-notes/:clinicalNoteId
 * @desc Update clinical note
 * @access Private (Doctor)
 */
router.put('/:clinicalNoteId',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('clinicalNoteId')
      .isMongoId()
      .withMessage('Clinical note ID must be a valid MongoDB ObjectId'),
    body('subjective')
      .optional()
      .isObject()
      .withMessage('Subjective section must be an object'),
    body('objective')
      .optional()
      .isObject()
      .withMessage('Objective section must be an object'),
    body('assessment')
      .optional()
      .isObject()
      .withMessage('Assessment section must be an object'),
    body('plan')
      .optional()
      .isObject()
      .withMessage('Plan section must be an object'),
    body('status')
      .optional()
      .isIn(['generating', 'draft', 'review', 'approved', 'signed', 'amended', 'cancelled'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('Invalid priority level')
  ],
  validate,
  clinicalNoteController.updateClinicalNote
);

/**
 * @route POST /api/clinical-notes/:clinicalNoteId/review
 * @desc Review clinical note
 * @access Private (Doctor)
 */
router.post('/:clinicalNoteId/review',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('clinicalNoteId')
      .isMongoId()
      .withMessage('Clinical note ID must be a valid MongoDB ObjectId'),
    body('comments')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Comments must be a string with maximum 1000 characters')
  ],
  validate,
  clinicalNoteController.reviewClinicalNote
);

/**
 * @route POST /api/clinical-notes/:clinicalNoteId/approve
 * @desc Approve clinical note
 * @access Private (Doctor)
 */
router.post('/:clinicalNoteId/approve',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('clinicalNoteId')
      .isMongoId()
      .withMessage('Clinical note ID must be a valid MongoDB ObjectId')
  ],
  validate,
  clinicalNoteController.approveClinicalNote
);

/**
 * @route POST /api/clinical-notes/:clinicalNoteId/sign
 * @desc Sign clinical note
 * @access Private (Doctor)
 */
router.post('/:clinicalNoteId/sign',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('clinicalNoteId')
      .isMongoId()
      .withMessage('Clinical note ID must be a valid MongoDB ObjectId')
  ],
  validate,
  clinicalNoteController.signClinicalNote
);

/**
 * @route GET /api/clinical-notes/patient/:patientId
 * @desc Get clinical notes by patient
 * @access Private (Doctor)
 */
router.get('/patient/:patientId',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('patientId')
      .isUUID()
      .withMessage('Patient ID must be a valid UUID'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  validate,
  clinicalNoteController.getClinicalNotesByPatient
);

/**
 * @route GET /api/clinical-notes/doctor/:doctorId
 * @desc Get clinical notes by doctor
 * @access Private (Doctor/Admin)
 */
router.get('/doctor/:doctorId',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('doctorId')
      .isUUID()
      .withMessage('Doctor ID must be a valid UUID'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],
  validate,
  clinicalNoteController.getClinicalNotesByDoctor
);

/**
 * @route GET /api/clinical-notes/pending
 * @desc Get pending clinical notes for review
 * @access Private (Doctor)
 */
router.get('/pending',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    query('doctorId')
      .optional()
      .isUUID()
      .withMessage('Doctor ID must be a valid UUID')
  ],
  validate,
  clinicalNoteController.getPendingReview
);

/**
 * @route GET /api/clinical-notes/stats
 * @desc Get clinical note statistics
 * @access Private (Doctor)
 */
router.get('/stats',
  defaultRateLimit,
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
  clinicalNoteController.getStatistics
);

/**
 * @route POST /api/clinical-notes/:clinicalNoteId/regenerate
 * @desc Regenerate clinical note with different parameters
 * @access Private (Doctor)
 */
router.post('/:clinicalNoteId/regenerate',
  aiGenerationRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('clinicalNoteId')
      .isMongoId()
      .withMessage('Clinical note ID must be a valid MongoDB ObjectId'),
    body('options')
      .optional()
      .isObject()
      .withMessage('Options must be an object'),
    body('options.temperature')
      .optional()
      .isFloat({ min: 0, max: 2 })
      .withMessage('Temperature must be between 0 and 2'),
    body('options.maxOutputTokens')
      .optional()
      .isInt({ min: 100, max: 8192 })
      .withMessage('Max output tokens must be between 100 and 8192')
  ],
  validate,
  clinicalNoteController.regenerateClinicalNote
);

module.exports = router;
