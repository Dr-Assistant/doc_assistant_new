/**
 * Consent Service
 * Handles ABDM consent management operations
 */

const { v4: uuidv4 } = require('uuid');
const { createAbdmApiClient } = require('./abdm-auth.service');
const { ConsentRequest, ConsentArtifact, ConsentAuditLog } = require('../models');
const { logger } = require('../utils/logger');
const config = require('../config');
const {
  BadRequestError,
  NotFoundError,
  ConflictError,
  AbdmError
} = require('../middleware/error.middleware');

/**
 * Request consent from ABDM
 * @param {Object} consentData - Consent request data
 * @param {Object} user - Requesting user
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Promise<Object>} Consent request
 */
exports.requestConsent = async (consentData, user, ipAddress, userAgent) => {
  try {
    // Validate consent data
    validateConsentRequest(consentData);

    // Create consent request in database
    const consentRequest = await ConsentRequest.create({
      patientId: consentData.patientId,
      doctorId: user.id,
      purposeCode: consentData.purpose.code,
      purposeText: consentData.purpose.text,
      hiTypes: consentData.hiTypes,
      dateRangeFrom: consentData.dateRange.from,
      dateRangeTo: consentData.dateRange.to,
      expiry: consentData.expiry,
      hips: consentData.hips || [],
      callbackUrl: config.abdm.consentCallbackUrl
    });

    // Prepare ABDM consent request
    const abdmRequest = {
      requestId: uuidv4(),
      timestamp: new Date().toISOString(),
      consent: {
        purpose: {
          text: consentData.purpose.text,
          code: consentData.purpose.code,
          refUri: "http://projecteka.in/consent-purpose"
        },
        patient: {
          id: consentData.patientAbhaId // This should be the patient's ABHA ID
        },
        hiu: {
          id: config.abdm.hiuId || "HIU_ID_PLACEHOLDER"
        },
        requester: {
          name: user.full_name,
          identifier: {
            type: "REGNO",
            value: user.registration_number || "REG_PLACEHOLDER",
            system: "https://www.mciindia.org"
          }
        },
        hiTypes: consentData.hiTypes,
        permission: {
          accessMode: "VIEW",
          dateRange: {
            from: consentData.dateRange.from,
            to: consentData.dateRange.to
          },
          dataEraseAt: consentData.expiry,
          frequency: {
            unit: "HOUR",
            value: 1,
            repeats: 0
          }
        }
      }
    };

    // Send request to ABDM
    const abdmClient = await createAbdmApiClient();
    const response = await abdmClient.post('/v0.5/consent-requests/init', abdmRequest);

    // Update consent request with ABDM response
    await consentRequest.update({
      abdmRequestId: response.data.consent?.id || abdmRequest.requestId
    });

    // Log the action
    await ConsentAuditLog.logAction({
      consentRequestId: consentRequest.id,
      action: 'CONSENT_REQUESTED',
      actorId: user.id,
      actorType: 'doctor',
      details: {
        abdmRequestId: consentRequest.abdmRequestId,
        hiTypes: consentData.hiTypes,
        purpose: consentData.purpose
      },
      ipAddress,
      userAgent
    });

    logger.info('Consent request created successfully', {
      consentRequestId: consentRequest.id,
      abdmRequestId: consentRequest.abdmRequestId,
      doctorId: user.id,
      patientId: consentData.patientId
    });

    return {
      id: consentRequest.id,
      abdmRequestId: consentRequest.abdmRequestId,
      status: consentRequest.status,
      createdAt: consentRequest.createdAt
    };

  } catch (error) {
    logger.error('Error requesting consent:', error);

    if (error.response?.status === 400) {
      throw new BadRequestError('Invalid consent request data', error.response.data);
    }

    if (error instanceof BadRequestError) {
      throw error;
    }

    throw new AbdmError('Failed to request consent from ABDM', {
      message: error.message,
      response: error.response?.data
    });
  }
};

/**
 * Get consent status
 * @param {string} consentRequestId - Consent request ID
 * @returns {Promise<Object>} Consent status
 */
exports.getConsentStatus = async (consentRequestId) => {
  try {
    const consentRequest = await ConsentRequest.findByPk(consentRequestId, {
      include: [{
        model: ConsentArtifact,
        as: 'artifacts'
      }]
    });

    if (!consentRequest) {
      throw new NotFoundError('Consent request not found');
    }

    return {
      id: consentRequest.id,
      abdmRequestId: consentRequest.abdmRequestId,
      status: consentRequest.status,
      purpose: {
        code: consentRequest.purposeCode,
        text: consentRequest.purposeText
      },
      hiTypes: consentRequest.hiTypes,
      dateRange: {
        from: consentRequest.dateRangeFrom,
        to: consentRequest.dateRangeTo
      },
      expiry: consentRequest.expiry,
      artifacts: consentRequest.artifacts?.map(artifact => ({
        id: artifact.id,
        abdmArtifactId: artifact.abdmArtifactId,
        status: artifact.status,
        grantedAt: artifact.grantedAt,
        expiresAt: artifact.expiresAt
      })) || [],
      createdAt: consentRequest.createdAt,
      updatedAt: consentRequest.updatedAt
    };

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    logger.error('Error getting consent status:', error);
    throw new Error('Failed to get consent status');
  }
};

/**
 * Validate consent request data
 * @param {Object} consentData - Consent request data
 */
function validateConsentRequest(consentData) {
  const required = ['patientId', 'purpose', 'hiTypes', 'dateRange', 'expiry'];

  for (const field of required) {
    if (!consentData[field]) {
      throw new BadRequestError(`Missing required field: ${field}`);
    }
  }

  if (!consentData.purpose.code || !consentData.purpose.text) {
    throw new BadRequestError('Purpose must include both code and text');
  }

  if (!Array.isArray(consentData.hiTypes) || consentData.hiTypes.length === 0) {
    throw new BadRequestError('hiTypes must be a non-empty array');
  }

  if (!consentData.dateRange.from || !consentData.dateRange.to) {
    throw new BadRequestError('Date range must include both from and to dates');
  }

  const fromDate = new Date(consentData.dateRange.from);
  const toDate = new Date(consentData.dateRange.to);
  const expiryDate = new Date(consentData.expiry);

  if (fromDate > toDate) {
    throw new BadRequestError('From date must be before to date');
  }

  if (expiryDate <= new Date()) {
    throw new BadRequestError('Expiry date must be in the future');
  }
}

/**
 * List active consents for a patient
 * @param {string} patientId - Patient ID
 * @returns {Promise<Array>} Active consents
 */
exports.listActiveConsents = async (patientId) => {
  try {
    const consents = await ConsentRequest.findActiveByPatient(patientId);

    return consents.map(consent => ({
      id: consent.id,
      abdmRequestId: consent.abdmRequestId,
      status: consent.status,
      purpose: {
        code: consent.purposeCode,
        text: consent.purposeText
      },
      hiTypes: consent.hiTypes,
      dateRange: {
        from: consent.dateRangeFrom,
        to: consent.dateRangeTo
      },
      expiry: consent.expiry,
      createdAt: consent.createdAt
    }));

  } catch (error) {
    logger.error('Error listing active consents:', error);
    throw new Error('Failed to list active consents');
  }
};

/**
 * Revoke consent
 * @param {string} consentRequestId - Consent request ID
 * @param {string} reason - Revocation reason
 * @param {Object} user - User revoking consent
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Promise<Object>} Revocation result
 */
exports.revokeConsent = async (consentRequestId, reason, user, ipAddress, userAgent) => {
  try {
    const consentRequest = await ConsentRequest.findByPk(consentRequestId, {
      include: [{
        model: ConsentArtifact,
        as: 'artifacts',
        where: { status: 'ACTIVE' },
        required: false
      }]
    });

    if (!consentRequest) {
      throw new NotFoundError('Consent request not found');
    }

    if (!consentRequest.canBeRevoked()) {
      throw new ConflictError('Consent cannot be revoked in current status');
    }

    // Update consent request status
    await consentRequest.update({ status: 'REVOKED' });

    // Revoke all active artifacts
    for (const artifact of consentRequest.artifacts || []) {
      await artifact.revoke(reason);
    }

    // Log the action
    await ConsentAuditLog.logAction({
      consentRequestId: consentRequest.id,
      action: 'CONSENT_REVOKED',
      actorId: user.id,
      actorType: 'doctor',
      details: { reason },
      ipAddress,
      userAgent
    });

    // TODO: Notify ABDM about revocation
    // This would involve calling ABDM's consent revocation API

    logger.info('Consent revoked successfully', {
      consentRequestId: consentRequest.id,
      reason,
      userId: user.id
    });

    return {
      success: true,
      message: 'Consent revoked successfully'
    };

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }

    logger.error('Error revoking consent:', error);
    throw new Error('Failed to revoke consent');
  }
};

/**
 * Handle consent callback from ABDM
 * @param {Object} callbackData - Callback data from ABDM
 * @returns {Promise<Object>} Processing result
 */
exports.handleConsentCallback = async (callbackData) => {
  try {
    const { consentRequestId, status, consentArtefact } = callbackData;

    // Find the consent request
    const consentRequest = await ConsentRequest.findByAbdmRequestId(consentRequestId);

    if (!consentRequest) {
      logger.warn('Received callback for unknown consent request', { consentRequestId });
      return { success: false, message: 'Consent request not found' };
    }

    // Update consent request status
    await consentRequest.update({ status: status.toUpperCase() });

    // If consent is granted, create consent artifact
    if (status === 'GRANTED' && consentArtefact) {
      await ConsentArtifact.create({
        consentRequestId: consentRequest.id,
        abdmArtifactId: consentArtefact.id,
        artifactData: consentArtefact,
        status: 'ACTIVE',
        grantedAt: new Date(),
        expiresAt: new Date(consentArtefact.permission?.dataEraseAt)
      });
    }

    // Log the callback
    await ConsentAuditLog.logAction({
      consentRequestId: consentRequest.id,
      action: `CONSENT_${status.toUpperCase()}`,
      actorType: 'abdm',
      details: callbackData
    });

    logger.info('Consent callback processed successfully', {
      consentRequestId: consentRequest.id,
      status
    });

    return { success: true, message: 'Callback processed successfully' };

  } catch (error) {
    logger.error('Error processing consent callback:', error);
    throw new Error('Failed to process consent callback');
  }
};
