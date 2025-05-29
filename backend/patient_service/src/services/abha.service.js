/**
 * ABHA Integration Service
 * Handles ABHA (Ayushman Bharat Health Account) integration
 */

const axios = require('axios');
const { logger } = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

class ABHAService {
  constructor() {
    this.baseURL = process.env.ABDM_BASE_URL;
    this.clientId = process.env.ABDM_CLIENT_ID;
    this.clientSecret = process.env.ABDM_CLIENT_SECRET;
    this.authUrl = process.env.ABDM_AUTH_URL;
    this.consentCallbackUrl = process.env.CONSENT_CALLBACK_URL;
    this.healthRecordCallbackUrl = process.env.HEALTH_RECORD_CALLBACK_URL;
    this.tokenEncryptionKey = process.env.TOKEN_ENCRYPTION_KEY;
    this.dataEncryptionKey = process.env.DATA_ENCRYPTION_KEY;
  }

  /**
   * Generate ABHA session token
   * @returns {Promise<string>} Session token
   */
  async generateSessionToken() {
    try {
      const response = await axios.post(this.authUrl, {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        grantType: 'client_credentials'
      });

      return response.data.access_token;
    } catch (error) {
      logger.error('Failed to generate ABHA session token:', error);
      throw new Error('Failed to authenticate with ABHA gateway');
    }
  }

  /**
   * Verify ABHA ID
   * @param {string} abhaId - ABHA ID to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyABHAId(abhaId) {
    try {
      const token = await this.generateSessionToken();
      const response = await axios.get(`${this.baseURL}/v0.5/accounts/verify/${abhaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CM-ID': 'sbx'
        }
      });

      return {
        isValid: response.data.valid,
        details: response.data.details
      };
    } catch (error) {
      logger.error('Failed to verify ABHA ID:', error);
      throw new Error('Failed to verify ABHA ID');
    }
  }

  /**
   * Create consent request for health records
   * @param {string} patientId - Patient ID
   * @param {string} abhaId - ABHA ID
   * @param {Object} purpose - Purpose of data access
   * @returns {Promise<Object>} Consent request details
   */
  async createConsentRequest(patientId, abhaId, purpose) {
    try {
      const token = await this.generateSessionToken();
      const response = await axios.post(`${this.baseURL}/v0.5/consent-requests`, {
        patientId,
        abhaId,
        purpose,
        callbackUrl: this.consentCallbackUrl,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CM-ID': 'sbx'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create consent request:', error);
      throw new Error('Failed to create consent request');
    }
  }

  /**
   * Fetch health records using consent
   * @param {string} consentId - Consent ID
   * @returns {Promise<Object>} Health records
   */
  async fetchHealthRecords(consentId) {
    try {
      const token = await this.generateSessionToken();
      const response = await axios.get(`${this.baseURL}/v0.5/health-records/${consentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CM-ID': 'sbx'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch health records:', error);
      throw new Error('Failed to fetch health records');
    }
  }

  /**
   * Sync patient data with ABHA
   * @param {string} patientId - Patient ID
   * @param {Object} patientData - Patient data to sync
   * @returns {Promise<Object>} Sync result
   */
  async syncPatientData(patientId, patientData) {
    try {
      const token = await this.generateSessionToken();
      const response = await axios.post(`${this.baseURL}/v0.5/patients/${patientId}/sync`, {
        data: patientData,
        callbackUrl: this.healthRecordCallbackUrl
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CM-ID': 'sbx'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to sync patient data:', error);
      throw new Error('Failed to sync patient data with ABHA');
    }
  }

  /**
   * Handle consent callback
   * @param {Object} callbackData - Callback data from ABHA
   * @returns {Promise<Object>} Processed callback data
   */
  async handleConsentCallback(callbackData) {
    try {
      // Process consent callback
      const { consentId, status, error } = callbackData;

      if (status === 'GRANTED') {
        // Fetch health records if consent is granted
        return await this.fetchHealthRecords(consentId);
      } else {
        throw new ValidationError(error || 'Consent request was not granted');
      }
    } catch (error) {
      logger.error('Failed to handle consent callback:', error);
      throw error;
    }
  }

  /**
   * Handle health record callback
   * @param {Object} callbackData - Callback data from ABHA
   * @returns {Promise<Object>} Processed callback data
   */
  async handleHealthRecordCallback(callbackData) {
    try {
      // Process health record callback
      const { patientId, records, error } = callbackData;

      if (error) {
        throw new ValidationError(error);
      }

      return {
        patientId,
        records,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Failed to handle health record callback:', error);
      throw error;
    }
  }
}

module.exports = new ABHAService(); 