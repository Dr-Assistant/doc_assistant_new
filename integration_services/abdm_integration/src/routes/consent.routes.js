/**
 * Consent Routes
 * Defines routes for consent management
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const consentController = require('../controllers/consent.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

/**
 * @route POST /api/abdm/consent/request
 * @desc Request consent from ABDM
 * @access Private
 */
router.post('/request',
  verifyToken,
  [
    body('patientId')
      .isUUID()
      .withMessage('Patient ID must be a valid UUID'),
    body('purpose.code')
      .notEmpty()
      .withMessage('Purpose code is required'),
    body('purpose.text')
      .notEmpty()
      .withMessage('Purpose text is required'),
    body('hiTypes')
      .isArray({ min: 1 })
      .withMessage('hiTypes must be a non-empty array'),
    body('hiTypes.*')
      .isIn(['DiagnosticReport', 'Prescription', 'DischargeSummary', 'OPConsultation', 'ImmunizationRecord', 'HealthDocumentRecord', 'WellnessRecord'])
      .withMessage('Invalid health information type'),
    body('dateRange.from')
      .isISO8601()
      .withMessage('From date must be a valid ISO date'),
    body('dateRange.to')
      .isISO8601()
      .withMessage('To date must be a valid ISO date'),
    body('expiry')
      .isISO8601()
      .withMessage('Expiry must be a valid ISO date'),
    body('hips')
      .optional()
      .isArray()
      .withMessage('HIPs must be an array'),
    body('patientAbhaId')
      .notEmpty()
      .withMessage('Patient ABHA ID is required')
  ],
  validate,
  consentController.requestConsent
);

/**
 * @route GET /api/abdm/consent/:consentRequestId/status
 * @desc Get consent status
 * @access Private
 */
router.get('/:consentRequestId/status',
  verifyToken,
  [
    param('consentRequestId')
      .isUUID()
      .withMessage('Consent request ID must be a valid UUID')
  ],
  validate,
  consentController.getConsentStatus
);

/**
 * @route GET /api/abdm/consent/active
 * @desc List active consents for a patient
 * @access Private
 */
router.get('/active',
  verifyToken,
  [
    query('patientId')
      .isUUID()
      .withMessage('Patient ID must be a valid UUID')
  ],
  validate,
  consentController.listActiveConsents
);

/**
 * @route POST /api/abdm/consent/:consentRequestId/revoke
 * @desc Revoke consent
 * @access Private
 */
router.post('/:consentRequestId/revoke',
  verifyToken,
  [
    param('consentRequestId')
      .isUUID()
      .withMessage('Consent request ID must be a valid UUID'),
    body('reason')
      .notEmpty()
      .withMessage('Revocation reason is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Reason must be between 10 and 500 characters')
  ],
  validate,
  consentController.revokeConsent
);

/**
 * @route POST /api/abdm/consent/callback
 * @desc Handle consent callback from ABDM
 * @access Public (ABDM webhook)
 */
router.post('/callback',
  // Note: This endpoint should be secured with ABDM-specific authentication
  // For now, we'll leave it open but add logging for security monitoring
  consentController.handleConsentCallback
);

/**
 * @route GET /api/abdm/consent/:consentRequestId/audit
 * @desc Get consent audit trail
 * @access Private
 */
router.get('/:consentRequestId/audit',
  verifyToken,
  [
    param('consentRequestId')
      .isUUID()
      .withMessage('Consent request ID must be a valid UUID')
  ],
  validate,
  consentController.getConsentAuditTrail
);

module.exports = router;
