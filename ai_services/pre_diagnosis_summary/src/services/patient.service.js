const axios = require('axios');
const logger = require('../utils/logger');
const { InternalServerError, NotFoundError } = require('../middleware/errorHandler');

class PatientService {
  constructor() {
    this.baseUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:8007';
    this.timeout = parseInt(process.env.PATIENT_TIMEOUT) || 10000;
    this.retryAttempts = parseInt(process.env.PATIENT_RETRY_ATTEMPTS) || 3;
  }

  /**
   * Get comprehensive patient data
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Patient data
   */
  async getPatientData(patientId) {
    try {
      logger.info('Fetching patient data', { patientId });

      // Get basic patient information
      const patientInfo = await this.getPatientInfo(patientId);
      
      // Get medical history
      const medicalHistory = await this.getMedicalHistory(patientId);
      
      // Get current medications
      const medications = await this.getCurrentMedications(patientId);
      
      // Get allergies
      const allergies = await this.getAllergies(patientId);
      
      // Get latest vital signs
      const vitalSigns = await this.getLatestVitalSigns(patientId);

      const patientData = {
        demographics: patientInfo,
        medicalHistory: medicalHistory || [],
        medications: medications || [],
        allergies: allergies || [],
        vitalSigns: vitalSigns,
        lastUpdated: new Date()
      };

      logger.info('Patient data fetched successfully', {
        patientId,
        hasHistory: medicalHistory?.length > 0,
        hasMedications: medications?.length > 0,
        hasAllergies: allergies?.length > 0,
        hasVitals: !!vitalSigns
      });

      return patientData;

    } catch (error) {
      logger.error('Failed to fetch patient data', {
        patientId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get basic patient information
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Patient information
   */
  async getPatientInfo(patientId) {
    try {
      const response = await this.makeRequest('GET', `/api/patients/${patientId}`);
      
      if (!response.data.success) {
        throw new NotFoundError('Patient not found');
      }

      const patient = response.data.data;
      
      return {
        id: patient.id,
        mrn: patient.mrn,
        abhaId: patient.abha_id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        fullName: `${patient.first_name} ${patient.last_name}`,
        dateOfBirth: patient.date_of_birth,
        age: this.calculateAge(patient.date_of_birth),
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        emergencyContact: patient.emergency_contact,
        bloodGroup: patient.blood_group,
        status: patient.status
      };

    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundError('Patient not found');
      }
      throw error;
    }
  }

  /**
   * Get patient medical history
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Medical history
   */
  async getMedicalHistory(patientId) {
    try {
      const response = await this.makeRequest('GET', `/api/patients/${patientId}/medical-history`);
      
      if (!response.data.success) {
        return [];
      }

      const history = response.data.data;
      
      return this.formatMedicalHistory(history);

    } catch (error) {
      logger.warn('Failed to fetch medical history', {
        patientId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get current medications
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Current medications
   */
  async getCurrentMedications(patientId) {
    try {
      const response = await this.makeRequest('GET', `/api/patients/${patientId}/medications?status=active`);
      
      if (!response.data.success) {
        return [];
      }

      const medications = response.data.data;
      
      return this.formatMedications(medications);

    } catch (error) {
      logger.warn('Failed to fetch current medications', {
        patientId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get patient allergies
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Allergies
   */
  async getAllergies(patientId) {
    try {
      const response = await this.makeRequest('GET', `/api/patients/${patientId}/allergies`);
      
      if (!response.data.success) {
        return [];
      }

      const allergies = response.data.data;
      
      return this.formatAllergies(allergies);

    } catch (error) {
      logger.warn('Failed to fetch allergies', {
        patientId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get latest vital signs
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Latest vital signs
   */
  async getLatestVitalSigns(patientId) {
    try {
      const response = await this.makeRequest('GET', `/api/patients/${patientId}/vital-signs/latest`);
      
      if (!response.data.success) {
        return null;
      }

      const vitalSigns = response.data.data;
      
      return this.formatVitalSigns(vitalSigns);

    } catch (error) {
      logger.warn('Failed to fetch vital signs', {
        patientId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Verify user access to patient
   * @param {string} patientId - Patient ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Access status
   */
  async verifyAccess(patientId, userId) {
    try {
      const response = await this.makeRequest('GET', `/api/patients/${patientId}/access?userId=${userId}`);
      
      return response.data.success && response.data.data.hasAccess;

    } catch (error) {
      logger.warn('Failed to verify patient access', {
        patientId,
        userId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Calculate age from date of birth
   * @param {string} dateOfBirth - Date of birth (YYYY-MM-DD)
   * @returns {number} Age in years
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Format medical history data
   * @param {Object} history - Raw medical history
   * @returns {Array} Formatted medical history
   */
  formatMedicalHistory(history) {
    if (!history || !history.chronic_conditions) {
      return [];
    }

    const conditions = [];

    // Process chronic conditions
    if (Array.isArray(history.chronic_conditions)) {
      history.chronic_conditions.forEach(condition => {
        conditions.push({
          condition: condition.name || condition.condition,
          diagnosedDate: condition.diagnosed_date || condition.date,
          status: condition.status || 'active',
          severity: condition.severity || 'moderate',
          notes: condition.notes || condition.description,
          source: 'local'
        });
      });
    }

    // Process past medical history
    if (history.past_medical_history && Array.isArray(history.past_medical_history)) {
      history.past_medical_history.forEach(condition => {
        conditions.push({
          condition: condition.condition || condition.name,
          diagnosedDate: condition.date,
          status: condition.status || 'resolved',
          severity: condition.severity || 'moderate',
          notes: condition.notes,
          source: 'local'
        });
      });
    }

    return conditions;
  }

  /**
   * Format medications data
   * @param {Array} medications - Raw medications
   * @returns {Array} Formatted medications
   */
  formatMedications(medications) {
    if (!Array.isArray(medications)) {
      return [];
    }

    return medications.map(med => ({
      name: med.name || med.medication_name,
      dosage: med.dosage || med.dose,
      frequency: med.frequency || med.schedule,
      startDate: med.start_date || med.prescribed_date,
      endDate: med.end_date,
      status: med.status || 'active',
      prescribedBy: med.prescribed_by || med.doctor_name,
      indication: med.indication || med.reason,
      source: 'local'
    }));
  }

  /**
   * Format allergies data
   * @param {Array} allergies - Raw allergies
   * @returns {Array} Formatted allergies
   */
  formatAllergies(allergies) {
    if (!Array.isArray(allergies)) {
      return [];
    }

    return allergies.map(allergy => ({
      allergen: allergy.allergen || allergy.substance || allergy.name,
      type: allergy.type || this.determineAllergyType(allergy.allergen),
      severity: allergy.severity || 'moderate',
      reaction: allergy.reaction || allergy.symptoms,
      notes: allergy.notes || allergy.description,
      source: 'local'
    }));
  }

  /**
   * Format vital signs data
   * @param {Object} vitalSigns - Raw vital signs
   * @returns {Object} Formatted vital signs
   */
  formatVitalSigns(vitalSigns) {
    if (!vitalSigns) return null;

    return {
      bloodPressure: {
        systolic: vitalSigns.systolic_bp || vitalSigns.systolic,
        diastolic: vitalSigns.diastolic_bp || vitalSigns.diastolic,
        unit: 'mmHg'
      },
      heartRate: {
        value: vitalSigns.heart_rate || vitalSigns.pulse,
        unit: 'bpm'
      },
      temperature: {
        value: vitalSigns.temperature || vitalSigns.temp,
        unit: vitalSigns.temp_unit || 'C'
      },
      respiratoryRate: {
        value: vitalSigns.respiratory_rate || vitalSigns.rr,
        unit: 'breaths/min'
      },
      oxygenSaturation: {
        value: vitalSigns.oxygen_saturation || vitalSigns.spo2,
        unit: '%'
      },
      weight: {
        value: vitalSigns.weight,
        unit: vitalSigns.weight_unit || 'kg'
      },
      height: {
        value: vitalSigns.height,
        unit: vitalSigns.height_unit || 'cm'
      },
      bmi: vitalSigns.bmi,
      recordedDate: vitalSigns.recorded_at || vitalSigns.created_at,
      source: 'local'
    };
  }

  /**
   * Determine allergy type from allergen name
   * @param {string} allergen - Allergen name
   * @returns {string} Allergy type
   */
  determineAllergyType(allergen) {
    if (!allergen) return 'other';
    
    const lowerAllergen = allergen.toLowerCase();
    
    const drugKeywords = ['penicillin', 'aspirin', 'ibuprofen', 'sulfa', 'antibiotic'];
    if (drugKeywords.some(keyword => lowerAllergen.includes(keyword))) {
      return 'drug';
    }
    
    const foodKeywords = ['peanut', 'shellfish', 'milk', 'egg', 'wheat', 'soy', 'fish', 'tree nut'];
    if (foodKeywords.some(keyword => lowerAllergen.includes(keyword))) {
      return 'food';
    }
    
    const envKeywords = ['pollen', 'dust', 'mold', 'pet', 'latex'];
    if (envKeywords.some(keyword => lowerAllergen.includes(keyword))) {
      return 'environmental';
    }
    
    return 'other';
  }

  /**
   * Make HTTP request to patient service
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
          const delay = Math.pow(2, attempt) * 1000;
          logger.warn(`Patient service request failed, retrying in ${delay}ms`, {
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
      return status >= 500 || status === 429;
    }
    
    return false;
  }
}

module.exports = new PatientService();
