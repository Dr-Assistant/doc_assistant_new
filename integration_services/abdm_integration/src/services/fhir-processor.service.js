/**
 * FHIR Resource Processor Service
 * Handles processing and validation of FHIR resources from ABDM
 */

const { 
  HealthRecord, 
  HealthRecordProcessingLog 
} = require('../models');
const { logger } = require('../utils/logger');
const { BadRequestError } = require('../middleware/error.middleware');

/**
 * Process health information bundle from ABDM
 * @param {Object} healthInfoBundle - ABDM health information bundle
 * @param {string} fetchRequestId - Fetch request ID
 * @returns {Promise<Object>} Processing result
 */
exports.processHealthInfoBundle = async (healthInfoBundle, fetchRequestId) => {
  const startTime = Date.now();
  let processedCount = 0;
  let failedCount = 0;
  const errors = [];

  try {
    logger.info('Processing health information bundle', {
      fetchRequestId,
      bundleId: healthInfoBundle.id,
      entryCount: healthInfoBundle.entry?.length || 0
    });

    // Validate bundle structure
    if (!healthInfoBundle.resourceType || healthInfoBundle.resourceType !== 'Bundle') {
      throw new BadRequestError('Invalid FHIR Bundle resource type');
    }

    if (!healthInfoBundle.entry || !Array.isArray(healthInfoBundle.entry)) {
      throw new BadRequestError('Bundle must contain entry array');
    }

    // Process each entry in the bundle
    for (const entry of healthInfoBundle.entry) {
      try {
        await processHealthInfoEntry(entry, fetchRequestId);
        processedCount++;
      } catch (error) {
        failedCount++;
        errors.push({
          entryId: entry.resource?.id,
          error: error.message
        });
        
        logger.error('Failed to process health info entry', {
          fetchRequestId,
          entryId: entry.resource?.id,
          error: error.message
        });
      }
    }

    const processingTime = Date.now() - startTime;

    // Log overall processing result
    await HealthRecordProcessingLog.logProcessing({
      fetchRequestId,
      processingStage: 'PARSE',
      status: failedCount === 0 ? 'SUCCESS' : (processedCount > 0 ? 'PARTIAL' : 'FAILED'),
      processingTimeMs: processingTime,
      details: {
        totalEntries: healthInfoBundle.entry.length,
        processedCount,
        failedCount,
        errors: errors.slice(0, 10) // Limit error details
      }
    });

    return {
      success: true,
      processedCount,
      failedCount,
      totalCount: healthInfoBundle.entry.length,
      processingTimeMs: processingTime,
      errors
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    await HealthRecordProcessingLog.logProcessing({
      fetchRequestId,
      processingStage: 'PARSE',
      status: 'FAILED',
      errorMessage: error.message,
      processingTimeMs: processingTime
    });

    logger.error('Failed to process health information bundle', {
      fetchRequestId,
      error: error.message
    });

    throw error;
  }
};

/**
 * Process individual health information entry
 * @param {Object} entry - FHIR Bundle entry
 * @param {string} fetchRequestId - Fetch request ID
 * @returns {Promise<Object>} Processed health record
 */
async function processHealthInfoEntry(entry, fetchRequestId) {
  const startTime = Date.now();

  try {
    // Validate entry structure
    if (!entry.resource) {
      throw new BadRequestError('Bundle entry must contain resource');
    }

    const resource = entry.resource;
    
    // Extract basic information
    const recordInfo = extractRecordInfo(resource);
    
    // Validate required fields
    validateRecordInfo(recordInfo);

    // Check for duplicate records
    const existingRecord = await HealthRecord.findByAbdmRecordId(recordInfo.abdmRecordId);
    if (existingRecord) {
      logger.info('Skipping duplicate health record', {
        abdmRecordId: recordInfo.abdmRecordId,
        existingRecordId: existingRecord.id
      });
      
      await HealthRecordProcessingLog.logProcessing({
        fetchRequestId,
        healthRecordId: existingRecord.id,
        abdmRecordId: recordInfo.abdmRecordId,
        processingStage: 'STORE',
        status: 'SKIPPED',
        processingTimeMs: Date.now() - startTime,
        details: { reason: 'Duplicate record' }
      });
      
      return existingRecord;
    }

    // Create health record
    const healthRecord = await HealthRecord.create({
      patientId: recordInfo.patientId,
      fetchRequestId,
      abdmRecordId: recordInfo.abdmRecordId,
      recordType: recordInfo.recordType,
      recordDate: recordInfo.recordDate,
      providerId: recordInfo.providerId,
      providerName: recordInfo.providerName,
      providerType: recordInfo.providerType,
      fhirResource: resource,
      source: 'ABDM',
      status: 'ACTIVE'
    });

    const processingTime = Date.now() - startTime;

    // Log successful processing
    await HealthRecordProcessingLog.logProcessing({
      fetchRequestId,
      healthRecordId: healthRecord.id,
      abdmRecordId: recordInfo.abdmRecordId,
      processingStage: 'STORE',
      status: 'SUCCESS',
      processingTimeMs: processingTime,
      details: {
        recordType: recordInfo.recordType,
        recordDate: recordInfo.recordDate,
        provider: recordInfo.providerName
      }
    });

    logger.info('Health record processed successfully', {
      healthRecordId: healthRecord.id,
      abdmRecordId: recordInfo.abdmRecordId,
      recordType: recordInfo.recordType,
      processingTimeMs: processingTime
    });

    return healthRecord;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    await HealthRecordProcessingLog.logProcessing({
      fetchRequestId,
      abdmRecordId: entry.resource?.id,
      processingStage: 'STORE',
      status: 'FAILED',
      errorMessage: error.message,
      processingTimeMs: processingTime
    });

    throw error;
  }
}

/**
 * Extract record information from FHIR resource
 * @param {Object} resource - FHIR resource
 * @returns {Object} Extracted record information
 */
function extractRecordInfo(resource) {
  const recordType = mapResourceTypeToRecordType(resource.resourceType);
  
  return {
    abdmRecordId: resource.id,
    recordType,
    recordDate: extractRecordDate(resource),
    patientId: extractPatientId(resource),
    providerId: extractProviderId(resource),
    providerName: extractProviderName(resource),
    providerType: extractProviderType(resource)
  };
}

/**
 * Map FHIR resource type to our record type enum
 * @param {string} resourceType - FHIR resource type
 * @returns {string} Mapped record type
 */
function mapResourceTypeToRecordType(resourceType) {
  const mapping = {
    'DiagnosticReport': 'DiagnosticReport',
    'MedicationRequest': 'Prescription',
    'MedicationStatement': 'Prescription',
    'Observation': 'Observation',
    'Condition': 'Condition',
    'Procedure': 'Procedure',
    'Immunization': 'ImmunizationRecord',
    'DocumentReference': 'HealthDocumentRecord',
    'AllergyIntolerance': 'AllergyIntolerance',
    'Encounter': 'OPConsultation'
  };
  
  return mapping[resourceType] || 'HealthDocumentRecord';
}

/**
 * Extract record date from FHIR resource
 * @param {Object} resource - FHIR resource
 * @returns {string} Record date in YYYY-MM-DD format
 */
function extractRecordDate(resource) {
  let date = null;
  
  switch (resource.resourceType) {
    case 'DiagnosticReport':
      date = resource.effectiveDateTime || resource.issued;
      break;
    case 'MedicationRequest':
      date = resource.authoredOn;
      break;
    case 'Observation':
      date = resource.effectiveDateTime || resource.issued;
      break;
    case 'Condition':
      date = resource.recordedDate || resource.onsetDateTime;
      break;
    case 'Procedure':
      date = resource.performedDateTime || resource.performedPeriod?.start;
      break;
    case 'Immunization':
      date = resource.occurrenceDateTime;
      break;
    default:
      date = resource.date || resource.created || resource.authored;
  }
  
  if (!date) {
    date = new Date().toISOString();
  }
  
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Extract patient ID from FHIR resource
 * @param {Object} resource - FHIR resource
 * @returns {string} Patient ID
 */
function extractPatientId(resource) {
  // This would need to be mapped from ABDM patient reference to our internal patient ID
  // For now, we'll extract the reference and assume it can be resolved
  const patientRef = resource.subject?.reference || resource.patient?.reference;
  
  if (patientRef) {
    // Extract ID from reference like "Patient/123"
    const match = patientRef.match(/Patient\/(.+)/);
    if (match) {
      return match[1];
    }
  }
  
  // Fallback - this should be resolved from the fetch request context
  return null;
}

/**
 * Extract provider ID from FHIR resource
 * @param {Object} resource - FHIR resource
 * @returns {string} Provider ID
 */
function extractProviderId(resource) {
  // Extract from performer, author, or organization references
  const performer = resource.performer?.[0]?.reference;
  const author = resource.author?.reference;
  const organization = resource.organization?.reference;
  
  const ref = performer || author || organization;
  
  if (ref) {
    const match = ref.match(/(Organization|Practitioner)\/(.+)/);
    if (match) {
      return match[2];
    }
  }
  
  return null;
}

/**
 * Extract provider name from FHIR resource
 * @param {Object} resource - FHIR resource
 * @returns {string} Provider name
 */
function extractProviderName(resource) {
  // Try to get from performer, author, or contained resources
  if (resource.performer?.[0]?.display) {
    return resource.performer[0].display;
  }
  
  if (resource.author?.display) {
    return resource.author.display;
  }
  
  if (resource.organization?.display) {
    return resource.organization.display;
  }
  
  // Check contained resources
  if (resource.contained) {
    for (const contained of resource.contained) {
      if (contained.resourceType === 'Organization' && contained.name) {
        return contained.name;
      }
      if (contained.resourceType === 'Practitioner' && contained.name?.[0]) {
        const name = contained.name[0];
        return `${name.given?.join(' ') || ''} ${name.family || ''}`.trim();
      }
    }
  }
  
  return 'Unknown Provider';
}

/**
 * Extract provider type from FHIR resource
 * @param {Object} resource - FHIR resource
 * @returns {string} Provider type
 */
function extractProviderType(resource) {
  // Determine if it's a hospital, clinic, lab, etc.
  if (resource.category?.[0]?.coding?.[0]?.display) {
    return resource.category[0].coding[0].display;
  }
  
  if (resource.code?.coding?.[0]?.system?.includes('lab')) {
    return 'Laboratory';
  }
  
  if (resource.resourceType === 'DiagnosticReport') {
    return 'Diagnostic Center';
  }
  
  return 'Healthcare Provider';
}

/**
 * Validate extracted record information
 * @param {Object} recordInfo - Extracted record information
 */
function validateRecordInfo(recordInfo) {
  if (!recordInfo.abdmRecordId) {
    throw new BadRequestError('Resource must have an ID');
  }
  
  if (!recordInfo.recordType) {
    throw new BadRequestError('Unable to determine record type');
  }
  
  if (!recordInfo.recordDate) {
    throw new BadRequestError('Unable to determine record date');
  }
}
