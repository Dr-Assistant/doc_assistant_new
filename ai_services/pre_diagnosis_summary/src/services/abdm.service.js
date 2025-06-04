const axios = require('axios');
const logger = require('../utils/logger');
const { InternalServerError, NotFoundError } = require('../middleware/errorHandler');

class AbdmService {
  constructor() {
    this.baseUrl = process.env.ABDM_SERVICE_URL || 'http://localhost:8101';
    this.timeout = parseInt(process.env.ABDM_TIMEOUT) || 10000;
    this.retryAttempts = parseInt(process.env.ABDM_RETRY_ATTEMPTS) || 3;
  }

  /**
   * Get patient health records from ABDM
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Health records data
   */
  async getPatientHealthRecords(patientId, options = {}) {
    try {
      logger.info('Fetching ABDM health records', {
        patientId,
        options
      });

      const {
        dateRange,
        hiTypes = ['DiagnosticReport', 'Prescription', 'DischargeSummary', 'OPConsultation'],
        includeRaw = false
      } = options;

      const queryParams = new URLSearchParams({
        patientId,
        hiTypes: hiTypes.join(','),
        includeRaw: includeRaw.toString()
      });

      if (dateRange) {
        if (dateRange.from) queryParams.append('dateFrom', dateRange.from);
        if (dateRange.to) queryParams.append('dateTo', dateRange.to);
      }

      const response = await this.makeRequest(
        'GET',
        `/api/abdm/health-records/patient/${patientId}?${queryParams.toString()}`
      );

      if (!response.data.success) {
        throw new InternalServerError('Failed to fetch ABDM health records');
      }

      const healthRecords = response.data.data;

      // Process and structure the health records
      const processedRecords = this.processHealthRecords(healthRecords);

      logger.info('ABDM health records fetched successfully', {
        patientId,
        recordCount: processedRecords.records.length,
        sources: processedRecords.sources
      });

      return processedRecords;

    } catch (error) {
      logger.error('Failed to fetch ABDM health records', {
        patientId,
        error: error.message,
        stack: error.stack
      });

      // Return empty result instead of throwing to allow graceful degradation
      return {
        records: [],
        medicalHistory: [],
        medications: [],
        allergies: [],
        sources: [],
        lastFetched: new Date(),
        errors: [error.message]
      };
    }
  }

  /**
   * Get consent status for patient
   * @param {string} patientId - Patient ID
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>} Consent status
   */
  async getConsentStatus(patientId, doctorId) {
    try {
      const response = await this.makeRequest(
        'GET',
        `/api/abdm/consent/status?patientId=${patientId}&doctorId=${doctorId}`
      );

      return response.data.data;

    } catch (error) {
      logger.error('Failed to get consent status', {
        patientId,
        doctorId,
        error: error.message
      });
      
      return {
        hasConsent: false,
        status: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Request consent for health records
   * @param {string} patientId - Patient ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} consentData - Consent request data
   * @returns {Promise<Object>} Consent request result
   */
  async requestConsent(patientId, doctorId, consentData) {
    try {
      const requestData = {
        patientId,
        doctorId,
        purpose: consentData.purpose || {
          text: 'Pre-diagnosis summary generation',
          code: 'CAREMGT'
        },
        hiTypes: consentData.hiTypes || ['DiagnosticReport', 'Prescription', 'DischargeSummary'],
        dateRange: consentData.dateRange || {
          from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
          to: new Date().toISOString().split('T')[0] // today
        },
        expiry: consentData.expiry || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      const response = await this.makeRequest(
        'POST',
        '/api/abdm/consent/request',
        requestData
      );

      return response.data.data;

    } catch (error) {
      logger.error('Failed to request consent', {
        patientId,
        doctorId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process raw health records into structured format
   * @param {Array} healthRecords - Raw health records
   * @returns {Object} Processed health records
   */
  processHealthRecords(healthRecords) {
    const processed = {
      records: healthRecords,
      medicalHistory: [],
      medications: [],
      allergies: [],
      sources: [],
      lastFetched: new Date()
    };

    healthRecords.forEach(record => {
      try {
        // Track data sources
        if (record.source && !processed.sources.includes(record.source)) {
          processed.sources.push(record.source);
        }

        // Process based on record type
        switch (record.recordType) {
          case 'DiagnosticReport':
            this.processDiagnosticReport(record, processed);
            break;
          case 'Prescription':
            this.processPrescription(record, processed);
            break;
          case 'DischargeSummary':
            this.processDischargeSummary(record, processed);
            break;
          case 'OPConsultation':
            this.processOPConsultation(record, processed);
            break;
          case 'ImmunizationRecord':
            this.processImmunizationRecord(record, processed);
            break;
          default:
            logger.warn('Unknown record type', { recordType: record.recordType });
        }
      } catch (error) {
        logger.error('Failed to process health record', {
          recordId: record.id,
          recordType: record.recordType,
          error: error.message
        });
      }
    });

    return processed;
  }

  /**
   * Process diagnostic report
   * @param {Object} record - Diagnostic report record
   * @param {Object} processed - Processed data object
   */
  processDiagnosticReport(record, processed) {
    if (record.fhirData && record.fhirData.conclusion) {
      processed.medicalHistory.push({
        condition: record.fhirData.conclusion,
        diagnosedDate: record.fhirData.effectiveDateTime || record.createdAt,
        status: 'active',
        severity: 'moderate',
        notes: record.fhirData.presentedForm?.[0]?.data || '',
        source: 'abdm'
      });
    }
  }

  /**
   * Process prescription record
   * @param {Object} record - Prescription record
   * @param {Object} processed - Processed data object
   */
  processPrescription(record, processed) {
    if (record.fhirData && record.fhirData.medicationRequest) {
      const medications = Array.isArray(record.fhirData.medicationRequest) 
        ? record.fhirData.medicationRequest 
        : [record.fhirData.medicationRequest];

      medications.forEach(med => {
        processed.medications.push({
          name: med.medicationCodeableConcept?.text || med.medication?.display,
          dosage: med.dosageInstruction?.[0]?.text,
          frequency: med.dosageInstruction?.[0]?.timing?.repeat?.frequency,
          startDate: med.authoredOn || record.createdAt,
          status: med.status || 'active',
          prescribedBy: med.requester?.display,
          indication: med.reasonCode?.[0]?.text,
          source: 'abdm'
        });
      });
    }
  }

  /**
   * Process discharge summary
   * @param {Object} record - Discharge summary record
   * @param {Object} processed - Processed data object
   */
  processDischargeSummary(record, processed) {
    if (record.fhirData) {
      // Extract diagnoses
      if (record.fhirData.diagnosis) {
        record.fhirData.diagnosis.forEach(diag => {
          processed.medicalHistory.push({
            condition: diag.condition?.display || diag.text,
            diagnosedDate: record.fhirData.period?.start || record.createdAt,
            status: 'active',
            severity: diag.severity || 'moderate',
            notes: record.fhirData.text?.div || '',
            source: 'abdm'
          });
        });
      }

      // Extract medications from discharge summary
      if (record.fhirData.medication) {
        record.fhirData.medication.forEach(med => {
          processed.medications.push({
            name: med.medication?.display || med.text,
            dosage: med.dosage,
            frequency: med.frequency,
            startDate: record.fhirData.period?.start || record.createdAt,
            status: 'active',
            source: 'abdm'
          });
        });
      }
    }
  }

  /**
   * Process OP consultation record
   * @param {Object} record - OP consultation record
   * @param {Object} processed - Processed data object
   */
  processOPConsultation(record, processed) {
    if (record.fhirData && record.fhirData.reasonCode) {
      record.fhirData.reasonCode.forEach(reason => {
        processed.medicalHistory.push({
          condition: reason.text || reason.coding?.[0]?.display,
          diagnosedDate: record.fhirData.period?.start || record.createdAt,
          status: 'active',
          severity: 'moderate',
          notes: record.fhirData.note?.[0]?.text || '',
          source: 'abdm'
        });
      });
    }
  }

  /**
   * Process immunization record
   * @param {Object} record - Immunization record
   * @param {Object} processed - Processed data object
   */
  processImmunizationRecord(record, processed) {
    // Immunization records could be added to medical history as preventive care
    if (record.fhirData && record.fhirData.vaccineCode) {
      processed.medicalHistory.push({
        condition: `Immunization: ${record.fhirData.vaccineCode.text}`,
        diagnosedDate: record.fhirData.occurrenceDateTime || record.createdAt,
        status: 'completed',
        severity: 'mild',
        notes: `Vaccine administered: ${record.fhirData.vaccineCode.text}`,
        source: 'abdm'
      });
    }
  }

  /**
   * Make HTTP request to ABDM service
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(method, endpoint, data = null) {
    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await axios(config);
        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt < this.retryAttempts && this.isRetryableError(error)) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.warn(`ABDM request failed, retrying in ${delay}ms`, {
            attempt,
            endpoint,
            error: error.message
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error object
   * @returns {boolean} Whether error is retryable
   */
  isRetryableError(error) {
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    if (error.response) {
      const status = error.response.status;
      return status >= 500 || status === 429; // Server errors or rate limiting
    }
    
    return false;
  }
}

module.exports = new AbdmService();
