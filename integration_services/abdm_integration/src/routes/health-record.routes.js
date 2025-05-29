/**
 * Health Record Routes
 * Defines routes for health record management
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const healthRecordController = require('../controllers/health-record.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

/**
 * @route POST /api/abdm/health-records/fetch
 * @desc Fetch health records using consent
 * @access Private
 */
router.post('/fetch',
  verifyToken,
  [
    body('consentId')
      .isUUID()
      .withMessage('Consent ID must be a valid UUID'),
    body('patientId')
      .isUUID()
      .withMessage('Patient ID must be a valid UUID'),
    body('hiTypes')
      .optional()
      .isArray({ min: 1 })
      .withMessage('hiTypes must be a non-empty array if provided'),
    body('hiTypes.*')
      .optional()
      .isIn(['DiagnosticReport', 'Prescription', 'DischargeSummary', 'OPConsultation', 'ImmunizationRecord', 'HealthDocumentRecord', 'WellnessRecord', 'Observation', 'Condition', 'Procedure', 'MedicationRequest', 'AllergyIntolerance'])
      .withMessage('Invalid health information type'),
    body('dateRange.from')
      .optional()
      .isISO8601()
      .withMessage('From date must be a valid ISO date'),
    body('dateRange.to')
      .optional()
      .isISO8601()
      .withMessage('To date must be a valid ISO date')
  ],
  validate,
  healthRecordController.fetchHealthRecords
);

/**
 * @route GET /api/abdm/health-records/status/:requestId
 * @desc Get fetch request status
 * @access Private
 */
router.get('/status/:requestId',
  verifyToken,
  [
    param('requestId')
      .isUUID()
      .withMessage('Request ID must be a valid UUID')
  ],
  validate,
  healthRecordController.getFetchStatus
);

/**
 * @route GET /api/abdm/health-records/patient/:patientId
 * @desc Get health records for a patient
 * @access Private
 */
router.get('/patient/:patientId',
  verifyToken,
  [
    param('patientId')
      .isUUID()
      .withMessage('Patient ID must be a valid UUID'),
    query('type')
      .optional()
      .isIn(['DiagnosticReport', 'Prescription', 'DischargeSummary', 'OPConsultation', 'ImmunizationRecord', 'HealthDocumentRecord', 'WellnessRecord', 'Observation', 'Condition', 'Procedure', 'MedicationRequest', 'AllergyIntolerance'])
      .withMessage('Invalid record type'),
    query('source')
      .optional()
      .isIn(['ABDM', 'LOCAL', 'IMPORTED'])
      .withMessage('Invalid source'),
    query('from')
      .optional()
      .isISO8601()
      .withMessage('From date must be a valid ISO date'),
    query('to')
      .optional()
      .isISO8601()
      .withMessage('To date must be a valid ISO date'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
  ],
  validate,
  healthRecordController.getPatientHealthRecords
);

/**
 * @route GET /api/abdm/health-records/:recordId
 * @desc Get detailed health record
 * @access Private
 */
router.get('/:recordId',
  verifyToken,
  [
    param('recordId')
      .isUUID()
      .withMessage('Record ID must be a valid UUID')
  ],
  validate,
  healthRecordController.getHealthRecordDetails
);

/**
 * @route POST /api/abdm/health-records/callback
 * @desc Handle health information callback from ABDM
 * @access Public (ABDM webhook)
 */
router.post('/callback',
  // Note: This endpoint should be secured with ABDM-specific authentication
  // For now, we'll leave it open but add logging for security monitoring
  healthRecordController.handleHealthInfoCallback
);

/**
 * @route GET /api/abdm/health-records/status/:requestId/logs
 * @desc Get fetch request processing logs
 * @access Private
 */
router.get('/status/:requestId/logs',
  verifyToken,
  [
    param('requestId')
      .isUUID()
      .withMessage('Request ID must be a valid UUID')
  ],
  validate,
  healthRecordController.getFetchProcessingLogs
);

/**
 * @route POST /api/abdm/health-records/status/:requestId/cancel
 * @desc Cancel fetch request
 * @access Private
 */
router.post('/status/:requestId/cancel',
  verifyToken,
  [
    param('requestId')
      .isUUID()
      .withMessage('Request ID must be a valid UUID'),
    body('reason')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Reason must be between 5 and 200 characters')
  ],
  validate,
  healthRecordController.cancelFetchRequest
);

module.exports = router;
