const PreDiagnosisSummary = require('../models/PreDiagnosisSummary');
const abdmService = require('./abdm.service');
const patientService = require('./patient.service');
const geminiService = require('./gemini.service');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError, InternalServerError } = require('../middleware/errorHandler');

class PreDiagnosisSummaryService {
  constructor() {
    this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    this.processingTimeout = parseInt(process.env.PROCESSING_TIMEOUT) || 60000; // 60 seconds
    this.confidenceThreshold = parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.7;
  }

  /**
   * Generate pre-diagnosis summary for a patient
   * @param {Object} summaryData - Summary generation data
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Generated summary
   */
  async generateSummary(summaryData, context = {}) {
    try {
      logger.info('Starting pre-diagnosis summary generation', {
        patientId: summaryData.patientId,
        doctorId: context.doctorId,
        encounterId: summaryData.encounterId
      });

      const startTime = Date.now();

      // Validate input
      this.validateSummaryData(summaryData);

      // Create initial summary record
      const summary = await this.createInitialSummary(summaryData, context);

      // Gather patient data from multiple sources
      const patientData = await this.gatherPatientData(summaryData.patientId, summaryData.questionnaireData);

      // Update summary with gathered data
      await this.updateSummaryWithPatientData(summary, patientData);

      // Generate AI summary
      const aiSummary = await geminiService.generatePreDiagnosisSummary(
        patientData,
        {
          patientId: summaryData.patientId,
          encounterId: summaryData.encounterId,
          doctorId: context.doctorId,
          urgency: summaryData.urgency || 'medium'
        }
      );

      // Update summary with AI results
      summary.aiSummary = aiSummary;
      summary.status = 'completed';
      summary.updatedBy = context.doctorId;

      const completedSummary = await summary.save();

      const processingTime = Date.now() - startTime;

      logger.info('Pre-diagnosis summary generation completed', {
        summaryId: completedSummary._id,
        patientId: summaryData.patientId,
        processingTime,
        confidenceScore: aiSummary.confidenceScore
      });

      return this.formatSummaryResponse(completedSummary);

    } catch (error) {
      logger.error('Pre-diagnosis summary generation failed', {
        error: error.message,
        stack: error.stack,
        patientId: summaryData.patientId
      });
      throw error;
    }
  }

  /**
   * Get existing summary by ID
   * @param {string} summaryId - Summary ID
   * @param {string} userId - User ID for access control
   * @returns {Promise<Object>} Summary data
   */
  async getSummaryById(summaryId, userId) {
    try {
      const summary = await PreDiagnosisSummary.findById(summaryId);

      if (!summary) {
        throw new NotFoundError('Pre-diagnosis summary not found');
      }

      // Check access permissions
      if (summary.doctorId !== userId && summary.patientId !== userId) {
        // Additional check: verify if user has access to this patient
        const hasAccess = await this.verifyPatientAccess(summary.patientId, userId);
        if (!hasAccess) {
          throw new NotFoundError('Pre-diagnosis summary not found');
        }
      }

      // Mark as viewed
      await summary.markAsViewed(userId);

      return this.formatSummaryResponse(summary);

    } catch (error) {
      logger.error('Failed to get summary by ID', {
        summaryId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get summaries for a patient
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of summaries
   */
  async getSummariesByPatient(patientId, options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        status,
        startDate,
        endDate
      } = options;

      const query = { patientId };

      if (status) {
        query.status = status;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const summaries = await PreDiagnosisSummary.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      return summaries.map(summary => this.formatSummaryResponse(summary));

    } catch (error) {
      logger.error('Failed to get summaries by patient', {
        patientId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get summaries for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of summaries
   */
  async getSummariesByDoctor(doctorId, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        status,
        urgency,
        startDate,
        endDate
      } = options;

      const query = { doctorId };

      if (status) {
        query.status = status;
      }

      if (urgency) {
        query['aiSummary.urgencyLevel'] = urgency;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const summaries = await PreDiagnosisSummary.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      return summaries.map(summary => this.formatSummaryResponse(summary));

    } catch (error) {
      logger.error('Failed to get summaries by doctor', {
        doctorId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update summary status
   * @param {string} summaryId - Summary ID
   * @param {string} status - New status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated summary
   */
  async updateSummaryStatus(summaryId, status, userId) {
    try {
      const summary = await PreDiagnosisSummary.findById(summaryId);

      if (!summary) {
        throw new NotFoundError('Pre-diagnosis summary not found');
      }

      await summary.updateStatus(status, userId);

      logger.info('Summary status updated', {
        summaryId,
        oldStatus: summary.status,
        newStatus: status,
        updatedBy: userId
      });

      return this.formatSummaryResponse(summary);

    } catch (error) {
      logger.error('Failed to update summary status', {
        summaryId,
        status,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete summary
   * @param {string} summaryId - Summary ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteSummary(summaryId, userId) {
    try {
      const summary = await PreDiagnosisSummary.findById(summaryId);

      if (!summary) {
        throw new NotFoundError('Pre-diagnosis summary not found');
      }

      // Only allow deletion by the creator or admin
      if (summary.createdBy !== userId) {
        // Check if user is admin or has special permissions
        const hasPermission = await this.verifyDeletePermission(userId);
        if (!hasPermission) {
          throw new ValidationError('Insufficient permissions to delete summary');
        }
      }

      await PreDiagnosisSummary.findByIdAndDelete(summaryId);

      logger.info('Summary deleted', {
        summaryId,
        deletedBy: userId
      });

      return true;

    } catch (error) {
      logger.error('Failed to delete summary', {
        summaryId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // Helper methods

  /**
   * Validate summary data
   * @param {Object} summaryData - Summary data to validate
   */
  validateSummaryData(summaryData) {
    if (!summaryData.patientId) {
      throw new ValidationError('Patient ID is required');
    }

    if (!summaryData.patientId.match(/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/)) {
      throw new ValidationError('Invalid patient ID format');
    }

    if (summaryData.questionnaireData && typeof summaryData.questionnaireData !== 'object') {
      throw new ValidationError('Questionnaire data must be an object');
    }
  }

  /**
   * Create initial summary record
   * @param {Object} summaryData - Summary data
   * @param {Object} context - Context data
   * @returns {Promise<Object>} Created summary
   */
  async createInitialSummary(summaryData, context) {
    const summary = new PreDiagnosisSummary({
      patientId: summaryData.patientId,
      encounterId: summaryData.encounterId,
      doctorId: context.doctorId,
      appointmentId: summaryData.appointmentId,
      status: 'generating',
      priority: summaryData.priority || 'medium',
      createdBy: context.doctorId,
      questionnaireResponses: this.processQuestionnaireData(summaryData.questionnaireData || {}),
      dataSources: {
        abdmRecords: { available: false, recordCount: 0 },
        localRecords: { available: false, recordCount: 0 },
        questionnaire: {
          completed: !!(summaryData.questionnaireData && Object.keys(summaryData.questionnaireData).length > 0),
          completedAt: summaryData.questionnaireData ? new Date() : null,
          responseCount: summaryData.questionnaireData ? Object.keys(summaryData.questionnaireData).length : 0
        }
      }
    });

    return await summary.save();
  }

  /**
   * Gather patient data from multiple sources
   * @param {string} patientId - Patient ID
   * @param {Object} questionnaireData - Questionnaire responses
   * @returns {Promise<Object>} Compiled patient data
   */
  async gatherPatientData(patientId, questionnaireData = {}) {
    const patientData = {
      demographics: null,
      medicalHistory: [],
      medications: [],
      allergies: [],
      vitalSigns: null,
      abdmRecords: [],
      questionnaire: questionnaireData,
      sources: {
        local: false,
        abdm: false,
        questionnaire: Object.keys(questionnaireData).length > 0
      }
    };

    try {
      // Fetch local patient data
      const localData = await patientService.getPatientData(patientId);
      if (localData) {
        patientData.demographics = localData.demographics;
        patientData.medicalHistory = localData.medicalHistory || [];
        patientData.medications = localData.medications || [];
        patientData.allergies = localData.allergies || [];
        patientData.vitalSigns = localData.vitalSigns;
        patientData.sources.local = true;
      }
    } catch (error) {
      logger.warn('Failed to fetch local patient data', {
        patientId,
        error: error.message
      });
    }

    try {
      // Fetch ABDM records
      const abdmData = await abdmService.getPatientHealthRecords(patientId);
      if (abdmData && abdmData.records) {
        patientData.abdmRecords = abdmData.records;
        patientData.sources.abdm = true;

        // Merge ABDM data with local data
        this.mergeAbdmData(patientData, abdmData);
      }
    } catch (error) {
      logger.warn('Failed to fetch ABDM records', {
        patientId,
        error: error.message
      });
    }

    return patientData;
  }

  /**
   * Update summary with patient data
   * @param {Object} summary - Summary document
   * @param {Object} patientData - Patient data
   */
  async updateSummaryWithPatientData(summary, patientData) {
    // Update medical history
    summary.medicalHistory = this.formatMedicalHistory(patientData.medicalHistory);

    // Update medications
    summary.currentMedications = this.formatMedications(patientData.medications);

    // Update allergies
    summary.allergies = this.formatAllergies(patientData.allergies);

    // Update vital signs
    if (patientData.vitalSigns) {
      summary.vitalSigns = this.formatVitalSigns(patientData.vitalSigns);
    }

    // Update data sources
    summary.dataSources.localRecords.available = patientData.sources.local;
    summary.dataSources.localRecords.recordCount = patientData.medicalHistory.length + patientData.medications.length;
    summary.dataSources.localRecords.lastUpdated = new Date();

    summary.dataSources.abdmRecords.available = patientData.sources.abdm;
    summary.dataSources.abdmRecords.recordCount = patientData.abdmRecords.length;
    summary.dataSources.abdmRecords.lastFetched = new Date();

    await summary.save();
  }

  /**
   * Process questionnaire data into structured format
   * @param {Object} questionnaireData - Raw questionnaire data
   * @returns {Array} Processed questionnaire responses
   */
  processQuestionnaireData(questionnaireData) {
    const responses = [];

    Object.entries(questionnaireData).forEach(([key, value]) => {
      // Determine category based on question key
      let category = 'symptoms';
      if (key.includes('history') || key.includes('past')) category = 'history';
      if (key.includes('family')) category = 'family_history';
      if (key.includes('lifestyle') || key.includes('social')) category = 'social_history';

      // Determine priority based on content
      let priority = 'medium';
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (lowerValue.includes('severe') || lowerValue.includes('urgent') || lowerValue.includes('emergency')) {
          priority = 'high';
        } else if (lowerValue.includes('mild') || lowerValue.includes('minor')) {
          priority = 'low';
        }
      }

      responses.push({
        questionId: key,
        question: this.formatQuestionText(key),
        answer: value,
        category,
        priority
      });
    });

    return responses;
  }

  /**
   * Format question text from key
   * @param {string} key - Question key
   * @returns {string} Formatted question text
   */
  formatQuestionText(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Format medical history data
   * @param {Array} medicalHistory - Raw medical history
   * @returns {Array} Formatted medical history
   */
  formatMedicalHistory(medicalHistory) {
    return medicalHistory.map(item => ({
      condition: item.condition || item.diagnosis || item.name,
      diagnosedDate: item.diagnosedDate || item.date || item.onsetDate,
      status: item.status || 'active',
      severity: item.severity || 'moderate',
      notes: item.notes || item.description,
      source: item.source || 'local'
    }));
  }

  /**
   * Format medications data
   * @param {Array} medications - Raw medications
   * @returns {Array} Formatted medications
   */
  formatMedications(medications) {
    return medications.map(med => ({
      name: med.name || med.medication,
      dosage: med.dosage || med.dose,
      frequency: med.frequency || med.schedule,
      startDate: med.startDate || med.prescribedDate,
      endDate: med.endDate,
      status: med.status || 'active',
      prescribedBy: med.prescribedBy || med.doctor,
      indication: med.indication || med.reason,
      source: med.source || 'local'
    }));
  }

  /**
   * Format allergies data
   * @param {Array} allergies - Raw allergies
   * @returns {Array} Formatted allergies
   */
  formatAllergies(allergies) {
    return allergies.map(allergy => ({
      allergen: allergy.allergen || allergy.substance || allergy.name,
      type: allergy.type || this.determineAllergyType(allergy.allergen),
      severity: allergy.severity || 'moderate',
      reaction: allergy.reaction || allergy.symptoms,
      notes: allergy.notes || allergy.description,
      source: allergy.source || 'local'
    }));
  }

  /**
   * Determine allergy type from allergen name
   * @param {string} allergen - Allergen name
   * @returns {string} Allergy type
   */
  determineAllergyType(allergen) {
    if (!allergen) return 'other';

    const lowerAllergen = allergen.toLowerCase();

    // Common drug allergens
    const drugKeywords = ['penicillin', 'aspirin', 'ibuprofen', 'sulfa', 'antibiotic'];
    if (drugKeywords.some(keyword => lowerAllergen.includes(keyword))) {
      return 'drug';
    }

    // Common food allergens
    const foodKeywords = ['peanut', 'shellfish', 'milk', 'egg', 'wheat', 'soy', 'fish', 'tree nut'];
    if (foodKeywords.some(keyword => lowerAllergen.includes(keyword))) {
      return 'food';
    }

    // Environmental allergens
    const envKeywords = ['pollen', 'dust', 'mold', 'pet', 'latex'];
    if (envKeywords.some(keyword => lowerAllergen.includes(keyword))) {
      return 'environmental';
    }

    return 'other';
  }

  /**
   * Format vital signs data
   * @param {Object} vitalSigns - Raw vital signs
   * @returns {Object} Formatted vital signs
   */
  formatVitalSigns(vitalSigns) {
    return {
      bloodPressure: vitalSigns.bloodPressure || {
        systolic: vitalSigns.systolic,
        diastolic: vitalSigns.diastolic,
        unit: 'mmHg'
      },
      heartRate: vitalSigns.heartRate || {
        value: vitalSigns.pulse || vitalSigns.hr,
        unit: 'bpm'
      },
      temperature: vitalSigns.temperature || {
        value: vitalSigns.temp,
        unit: vitalSigns.tempUnit || 'C'
      },
      respiratoryRate: vitalSigns.respiratoryRate || {
        value: vitalSigns.rr || vitalSigns.respirations,
        unit: 'breaths/min'
      },
      oxygenSaturation: vitalSigns.oxygenSaturation || {
        value: vitalSigns.spo2 || vitalSigns.o2sat,
        unit: '%'
      },
      weight: vitalSigns.weight || {
        value: vitalSigns.weightValue,
        unit: vitalSigns.weightUnit || 'kg'
      },
      height: vitalSigns.height || {
        value: vitalSigns.heightValue,
        unit: vitalSigns.heightUnit || 'cm'
      },
      bmi: vitalSigns.bmi || this.calculateBMI(vitalSigns),
      recordedDate: vitalSigns.recordedDate || new Date(),
      source: vitalSigns.source || 'local'
    };
  }

  /**
   * Calculate BMI from height and weight
   * @param {Object} vitalSigns - Vital signs data
   * @returns {number} BMI value
   */
  calculateBMI(vitalSigns) {
    const weight = vitalSigns.weight?.value || vitalSigns.weightValue;
    const height = vitalSigns.height?.value || vitalSigns.heightValue;

    if (!weight || !height) return null;

    // Convert height to meters if in cm
    const heightInMeters = height > 10 ? height / 100 : height;

    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }

  /**
   * Merge ABDM data with existing patient data
   * @param {Object} patientData - Patient data object
   * @param {Object} abdmData - ABDM data
   */
  mergeAbdmData(patientData, abdmData) {
    if (abdmData.medicalHistory) {
      const abdmHistory = abdmData.medicalHistory.map(item => ({
        ...item,
        source: 'abdm'
      }));
      patientData.medicalHistory = [...patientData.medicalHistory, ...abdmHistory];
    }

    if (abdmData.medications) {
      const abdmMedications = abdmData.medications.map(item => ({
        ...item,
        source: 'abdm'
      }));
      patientData.medications = [...patientData.medications, ...abdmMedications];
    }

    if (abdmData.allergies) {
      const abdmAllergies = abdmData.allergies.map(item => ({
        ...item,
        source: 'abdm'
      }));
      patientData.allergies = [...patientData.allergies, ...abdmAllergies];
    }
  }

  /**
   * Format summary response for API
   * @param {Object} summary - Summary document
   * @returns {Object} Formatted response
   */
  formatSummaryResponse(summary) {
    return {
      id: summary._id,
      patientId: summary.patientId,
      encounterId: summary.encounterId,
      doctorId: summary.doctorId,
      appointmentId: summary.appointmentId,
      status: summary.status,
      priority: summary.priority,
      version: summary.version,
      dataSources: summary.dataSources,
      medicalHistory: summary.medicalHistory,
      currentMedications: summary.currentMedications,
      allergies: summary.allergies,
      vitalSigns: summary.vitalSigns,
      questionnaireResponses: summary.questionnaireResponses,
      aiSummary: summary.aiSummary,
      tags: summary.tags,
      notes: summary.notes,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
      createdBy: summary.createdBy,
      updatedBy: summary.updatedBy,
      lastViewedAt: summary.lastViewedAt
    };
  }

  /**
   * Verify patient access for user
   * @param {string} patientId - Patient ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Access status
   */
  async verifyPatientAccess(patientId, userId) {
    try {
      // This would typically check if the user has access to this patient
      // through the patient service or user service
      return await patientService.verifyAccess(patientId, userId);
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
   * Verify delete permission for user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Permission status
   */
  async verifyDeletePermission(userId) {
    try {
      // This would typically check if the user has admin privileges
      // or special permissions to delete summaries
      return false; // Default to no permission for safety
    } catch (error) {
      logger.warn('Failed to verify delete permission', {
        userId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get summary statistics for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Statistics
   */
  async getSummaryStatistics(doctorId, options = {}) {
    try {
      const {
        startDate,
        endDate
      } = options;

      const matchQuery = { doctorId };

      if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
        if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
      }

      const stats = await PreDiagnosisSummary.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalSummaries: { $sum: 1 },
            completedSummaries: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failedSummaries: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            urgentSummaries: {
              $sum: { $cond: [{ $eq: ['$aiSummary.urgencyLevel', 'urgent'] }, 1, 0] }
            },
            highPrioritySummaries: {
              $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
            },
            avgConfidenceScore: { $avg: '$aiSummary.confidenceScore' },
            avgProcessingTime: { $avg: '$aiSummary.processingTime' }
          }
        }
      ]);

      return stats[0] || {
        totalSummaries: 0,
        completedSummaries: 0,
        failedSummaries: 0,
        urgentSummaries: 0,
        highPrioritySummaries: 0,
        avgConfidenceScore: 0,
        avgProcessingTime: 0
      };

    } catch (error) {
      logger.error('Failed to get summary statistics', {
        doctorId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new PreDiagnosisSummaryService();
