/**
 * Health Record Service
 * Handles ABDM health record fetching operations
 */

const { v4: uuidv4 } = require('uuid');
const { createAbdmApiClient } = require('./abdm-auth.service');
const { 
  HealthRecordFetchRequest, 
  HealthRecord, 
  HealthRecordProcessingLog,
  HealthRecordAccessLog,
  ConsentArtifact 
} = require('../models');
const { logger } = require('../utils/logger');
const config = require('../config');
const { 
  BadRequestError, 
  NotFoundError, 
  ConflictError, 
  AbdmError 
} = require('../middleware/error.middleware');

/**
 * Fetch health records using consent artifact
 * @param {Object} fetchData - Health record fetch data
 * @param {Object} user - Requesting user
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Promise<Object>} Fetch request
 */
exports.fetchHealthRecords = async (fetchData, user, ipAddress, userAgent) => {
  try {
    // Validate fetch data
    validateFetchRequest(fetchData);
    
    // Get consent artifact
    const consentArtifact = await ConsentArtifact.findByPk(fetchData.consentId);
    if (!consentArtifact) {
      throw new NotFoundError('Consent artifact not found');
    }
    
    if (!consentArtifact.isActive()) {
      throw new ConflictError('Consent artifact is not active');
    }
    
    // Create fetch request in database
    const fetchRequest = await HealthRecordFetchRequest.create({
      consentArtifactId: consentArtifact.id,
      patientId: fetchData.patientId,
      doctorId: user.id,
      hiTypes: fetchData.hiTypes || consentArtifact.artifactData.permission?.hiTypes || [],
      dateRangeFrom: fetchData.dateRange?.from,
      dateRangeTo: fetchData.dateRange?.to,
      callbackUrl: config.abdm.healthRecordCallbackUrl
    });

    // Log processing start
    await HealthRecordProcessingLog.logProcessing({
      fetchRequestId: fetchRequest.id,
      processingStage: 'FETCH',
      status: 'SUCCESS',
      details: {
        consentArtifactId: consentArtifact.id,
        hiTypes: fetchRequest.hiTypes,
        dateRange: {
          from: fetchRequest.dateRangeFrom,
          to: fetchRequest.dateRangeTo
        }
      }
    });

    // Prepare ABDM health information request
    const abdmRequest = {
      requestId: uuidv4(),
      timestamp: new Date().toISOString(),
      hiRequest: {
        consent: {
          id: consentArtifact.abdmArtifactId
        },
        dateRange: {
          from: fetchRequest.dateRangeFrom || consentArtifact.artifactData.permission?.dateRange?.from,
          to: fetchRequest.dateRangeTo || consentArtifact.artifactData.permission?.dateRange?.to
        },
        dataPushUrl: config.abdm.healthRecordCallbackUrl,
        keyMaterial: {
          cryptoAlg: "ECDH",
          curve: "Curve25519",
          dhPublicKey: {
            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            parameters: "Curve25519/32byte random key",
            keyValue: generateKeyMaterial()
          },
          nonce: generateNonce()
        }
      }
    };

    // Send request to ABDM
    const abdmClient = await createAbdmApiClient();
    const response = await abdmClient.post('/v0.5/health-information/cm/request', abdmRequest);

    // Update fetch request with ABDM response
    await fetchRequest.update({
      abdmRequestId: response.data.hiRequest?.requestId || abdmRequest.requestId
    });

    logger.info('Health record fetch request created successfully', {
      fetchRequestId: fetchRequest.id,
      abdmRequestId: fetchRequest.abdmRequestId,
      doctorId: user.id,
      patientId: fetchData.patientId,
      consentArtifactId: consentArtifact.id
    });

    return {
      id: fetchRequest.id,
      abdmRequestId: fetchRequest.abdmRequestId,
      status: fetchRequest.status,
      createdAt: fetchRequest.createdAt
    };

  } catch (error) {
    logger.error('Error fetching health records:', error);
    
    if (error.response?.status === 400) {
      throw new BadRequestError('Invalid health record fetch request', error.response.data);
    }
    
    if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
    
    throw new AbdmError('Failed to fetch health records from ABDM', {
      message: error.message,
      response: error.response?.data
    });
  }
};

/**
 * Get fetch request status
 * @param {string} fetchRequestId - Fetch request ID
 * @returns {Promise<Object>} Fetch status
 */
exports.getFetchStatus = async (fetchRequestId) => {
  try {
    const fetchRequest = await HealthRecordFetchRequest.findByPk(fetchRequestId, {
      include: [{
        model: HealthRecord,
        as: 'healthRecords'
      }]
    });

    if (!fetchRequest) {
      throw new NotFoundError('Fetch request not found');
    }

    const progress = fetchRequest.getProgress();

    return {
      id: fetchRequest.id,
      abdmRequestId: fetchRequest.abdmRequestId,
      status: fetchRequest.status,
      progress,
      hiTypes: fetchRequest.hiTypes,
      dateRange: {
        from: fetchRequest.dateRangeFrom,
        to: fetchRequest.dateRangeTo
      },
      recordCount: fetchRequest.healthRecords?.length || 0,
      errorMessage: fetchRequest.errorMessage,
      createdAt: fetchRequest.createdAt,
      updatedAt: fetchRequest.updatedAt
    };

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    
    logger.error('Error getting fetch status:', error);
    throw new Error('Failed to get fetch status');
  }
};

/**
 * Get health records for a patient
 * @param {string} patientId - Patient ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Health records
 */
exports.getHealthRecords = async (patientId, options = {}) => {
  try {
    const records = await HealthRecord.findByPatient(patientId, {
      recordType: options.type,
      source: options.source,
      dateFrom: options.from,
      dateTo: options.to,
      limit: options.limit || 50,
      offset: options.offset || 0
    });

    const recordTypes = await HealthRecord.getRecordTypes(patientId);

    return {
      records: records.map(record => record.getDisplayInfo()),
      recordTypes: recordTypes.map(type => ({
        type: type.recordType,
        count: parseInt(type.dataValues.count)
      })),
      pagination: {
        limit: options.limit || 50,
        offset: options.offset || 0,
        total: records.length
      }
    };

  } catch (error) {
    logger.error('Error getting health records:', error);
    throw new Error('Failed to get health records');
  }
};

/**
 * Get detailed health record
 * @param {string} recordId - Health record ID
 * @param {Object} user - Requesting user
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Promise<Object>} Detailed health record
 */
exports.getHealthRecordDetails = async (recordId, user, ipAddress, userAgent) => {
  try {
    const record = await HealthRecord.findByPk(recordId);
    
    if (!record) {
      throw new NotFoundError('Health record not found');
    }

    if (!record.isActive()) {
      throw new ConflictError('Health record is not active');
    }

    // Verify data integrity
    if (!record.verifyIntegrity()) {
      logger.warn('Health record integrity check failed', { recordId });
      throw new ConflictError('Health record data integrity check failed');
    }

    // Log access
    await HealthRecordAccessLog.logAccess({
      healthRecordId: record.id,
      userId: user.id,
      accessType: 'VIEW',
      ipAddress,
      userAgent,
      details: {
        recordType: record.recordType,
        source: record.source
      }
    });

    return {
      id: record.id,
      type: record.recordType,
      date: record.recordDate,
      provider: {
        id: record.providerId,
        name: record.providerName,
        type: record.providerType
      },
      fhirResource: record.fhirResource,
      source: record.source,
      fetchedAt: record.fetchedAt,
      createdAt: record.createdAt
    };

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }
    
    logger.error('Error getting health record details:', error);
    throw new Error('Failed to get health record details');
  }
};

/**
 * Validate fetch request data
 * @param {Object} fetchData - Fetch request data
 */
function validateFetchRequest(fetchData) {
  const required = ['consentId', 'patientId'];
  
  for (const field of required) {
    if (!fetchData[field]) {
      throw new BadRequestError(`Missing required field: ${field}`);
    }
  }

  if (fetchData.hiTypes && (!Array.isArray(fetchData.hiTypes) || fetchData.hiTypes.length === 0)) {
    throw new BadRequestError('hiTypes must be a non-empty array if provided');
  }

  if (fetchData.dateRange) {
    if (fetchData.dateRange.from && fetchData.dateRange.to) {
      const fromDate = new Date(fetchData.dateRange.from);
      const toDate = new Date(fetchData.dateRange.to);
      
      if (fromDate > toDate) {
        throw new BadRequestError('From date must be before to date');
      }
    }
  }
}

/**
 * Generate key material for encryption
 * @returns {string} Base64 encoded key material
 */
function generateKeyMaterial() {
  // In a real implementation, this would generate proper cryptographic key material
  // For now, we'll use a placeholder
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Generate nonce for encryption
 * @returns {string} Base64 encoded nonce
 */
function generateNonce() {
  const crypto = require('crypto');
  return crypto.randomBytes(12).toString('base64');
}
