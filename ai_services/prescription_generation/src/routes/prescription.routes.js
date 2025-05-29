const express = require('express');
const { body, param, query } = require('express-validator');
const prescriptionController = require('../controllers/prescription.controller');
const { verifyToken, requireDoctor, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { aiGenerationRateLimit, defaultRateLimit } = require('../middleware/rateLimit.middleware');

const router = express.Router();

/**
 * @route POST /api/prescriptions/generate/clinical-note
 * @desc Generate prescription from clinical note
 * @access Private (Doctor)
 */
router.post('/generate/clinical-note',
  aiGenerationRateLimit,
  verifyToken,
  requireDoctor,
  [
    body('clinicalNoteId')
      .isMongoId()
      .withMessage('Clinical note ID must be a valid MongoDB ObjectId'),
    body('context')
      .optional()
      .isObject()
      .withMessage('Context must be an object'),
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
  prescriptionController.generateFromClinicalNote
);

/**
 * @route POST /api/prescriptions/generate/transcription
 * @desc Generate prescription from transcription
 * @access Private (Doctor)
 */
router.post('/generate/transcription',
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
    body('context.priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('Invalid priority level')
  ],
  validate,
  prescriptionController.generateFromTranscription
);

/**
 * @route POST /api/prescriptions/generate/text
 * @desc Generate prescription from text input
 * @access Private (Doctor)
 */
router.post('/generate/text',
  aiGenerationRateLimit,
  verifyToken,
  requireDoctor,
  [
    body('text')
      .isString()
      .isLength({ min: 20, max: 10000 })
      .withMessage('Text must be between 20 and 10000 characters'),
    body('context')
      .optional()
      .isObject()
      .withMessage('Context must be an object'),
    body('context.patientId')
      .optional()
      .isUUID()
      .withMessage('Patient ID must be a valid UUID'),
    body('context.encounterId')
      .optional()
      .isUUID()
      .withMessage('Encounter ID must be a valid UUID')
  ],
  validate,
  prescriptionController.generateFromText
);

/**
 * @route GET /api/prescriptions/:prescriptionId
 * @desc Get prescription by ID
 * @access Private (Doctor)
 */
router.get('/:prescriptionId',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('prescriptionId')
      .isMongoId()
      .withMessage('Prescription ID must be a valid MongoDB ObjectId')
  ],
  validate,
  prescriptionController.getPrescription
);

/**
 * @route GET /api/prescriptions/encounter/:encounterId
 * @desc Get prescription by encounter ID
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
  prescriptionController.getPrescriptionByEncounter
);

/**
 * @route PUT /api/prescriptions/:prescriptionId
 * @desc Update prescription
 * @access Private (Doctor)
 */
router.put('/:prescriptionId',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('prescriptionId')
      .isMongoId()
      .withMessage('Prescription ID must be a valid MongoDB ObjectId'),
    body('medications')
      .optional()
      .isArray()
      .withMessage('Medications must be an array'),
    body('medications.*.medicationName')
      .optional()
      .isString()
      .isLength({ min: 1, max: 200 })
      .withMessage('Medication name must be between 1 and 200 characters'),
    body('medications.*.dosage.amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Dosage amount must be a positive number'),
    body('medications.*.dosage.unit')
      .optional()
      .isIn(['mg', 'mcg', 'g', 'ml', 'units', 'puffs', 'drops', 'tablets', 'capsules'])
      .withMessage('Invalid dosage unit'),
    body('status')
      .optional()
      .isIn(['generating', 'draft', 'review', 'approved', 'signed', 'sent', 'dispensed', 'cancelled'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('Invalid priority level')
  ],
  validate,
  prescriptionController.updatePrescription
);

/**
 * @route POST /api/prescriptions/:prescriptionId/review
 * @desc Review prescription
 * @access Private (Doctor)
 */
router.post('/:prescriptionId/review',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('prescriptionId')
      .isMongoId()
      .withMessage('Prescription ID must be a valid MongoDB ObjectId'),
    body('comments')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Comments must be a string with maximum 1000 characters')
  ],
  validate,
  prescriptionController.reviewPrescription
);

/**
 * @route POST /api/prescriptions/:prescriptionId/approve
 * @desc Approve prescription
 * @access Private (Doctor)
 */
router.post('/:prescriptionId/approve',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('prescriptionId')
      .isMongoId()
      .withMessage('Prescription ID must be a valid MongoDB ObjectId')
  ],
  validate,
  prescriptionController.approvePrescription
);

/**
 * @route POST /api/prescriptions/:prescriptionId/sign
 * @desc Sign prescription
 * @access Private (Doctor)
 */
router.post('/:prescriptionId/sign',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('prescriptionId')
      .isMongoId()
      .withMessage('Prescription ID must be a valid MongoDB ObjectId')
  ],
  validate,
  prescriptionController.signPrescription
);

/**
 * @route POST /api/prescriptions/:prescriptionId/send
 * @desc Send prescription to pharmacy
 * @access Private (Doctor)
 */
router.post('/:prescriptionId/send',
  defaultRateLimit,
  verifyToken,
  requireDoctor,
  [
    param('prescriptionId')
      .isMongoId()
      .withMessage('Prescription ID must be a valid MongoDB ObjectId'),
    body('pharmacyId')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Pharmacy ID must be between 1 and 100 characters')
  ],
  validate,
  prescriptionController.sendPrescription
);

/**
 * @route GET /api/prescriptions/patient/:patientId
 * @desc Get prescriptions by patient
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
  prescriptionController.getPrescriptionsByPatient
);

/**
 * @route GET /api/prescriptions/doctor/:doctorId
 * @desc Get prescriptions by doctor
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
  prescriptionController.getPrescriptionsByDoctor
);

/**
 * @route GET /api/prescriptions/pending
 * @desc Get pending prescriptions for review
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
  prescriptionController.getPendingReview
);

/**
 * @route GET /api/prescriptions/stats
 * @desc Get prescription statistics
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
  prescriptionController.getStatistics
);

module.exports = router;
