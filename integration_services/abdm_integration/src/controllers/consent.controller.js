/**
 * Consent Controller
 * Handles HTTP requests for consent management
 */

const consentService = require('../services/consent.service');
const { logger } = require('../utils/logger');

/**
 * Request consent from ABDM
 * @route POST /api/abdm/consent/request
 */
exports.requestConsent = async (req, res, next) => {
  try {
    const consentData = req.body;
    const user = req.user;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await consentService.requestConsent(
      consentData,
      user,
      ipAddress,
      userAgent
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Consent request submitted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get consent status
 * @route GET /api/abdm/consent/:consentRequestId/status
 */
exports.getConsentStatus = async (req, res, next) => {
  try {
    const { consentRequestId } = req.params;

    const result = await consentService.getConsentStatus(consentRequestId);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * List active consents for a patient
 * @route GET /api/abdm/consent/active
 */
exports.listActiveConsents = async (req, res, next) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Patient ID is required' }
      });
    }

    const result = await consentService.listActiveConsents(patientId);

    res.status(200).json({
      success: true,
      data: { consents: result }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Revoke consent
 * @route POST /api/abdm/consent/:consentRequestId/revoke
 */
exports.revokeConsent = async (req, res, next) => {
  try {
    const { consentRequestId } = req.params;
    const { reason } = req.body;
    const user = req.user;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: { message: 'Revocation reason is required' }
      });
    }

    const result = await consentService.revokeConsent(
      consentRequestId,
      reason,
      user,
      ipAddress,
      userAgent
    );

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Handle consent callback from ABDM
 * @route POST /api/abdm/consent/callback
 */
exports.handleConsentCallback = async (req, res, next) => {
  try {
    const callbackData = req.body;

    logger.info('Received consent callback from ABDM', { callbackData });

    const result = await consentService.handleConsentCallback(callbackData);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get consent audit trail
 * @route GET /api/abdm/consent/:consentRequestId/audit
 */
exports.getConsentAuditTrail = async (req, res, next) => {
  try {
    const { consentRequestId } = req.params;
    const { ConsentAuditLog } = require('../models');

    const auditTrail = await ConsentAuditLog.getAuditTrail(consentRequestId);

    res.status(200).json({
      success: true,
      data: { auditTrail }
    });

  } catch (error) {
    next(error);
  }
};
