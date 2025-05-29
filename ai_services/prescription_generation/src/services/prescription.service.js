const Prescription = require('../models/Prescription');
const geminiService = require('./gemini.service');
const logger = require('../utils/logger');
const axios = require('axios');
const { InternalServerError, ValidationError, NotFoundError } = require('../utils/error-handler');

class PrescriptionService {
  constructor() {
    this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    this.processingTimeout = parseInt(process.env.PROCESSING_TIMEOUT) || 30000;
    this.confidenceThreshold = parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.7;
    this.enableDrugInteractionCheck = process.env.ENABLE_DRUG_INTERACTION_CHECK === 'true';
    this.enableDosageValidation = process.env.ENABLE_DOSAGE_VALIDATION === 'true';
  }

  /**
   * Generate prescription from clinical note or transcription
   * @param {Object} sourceData - Source data (clinical note or transcription)
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Generated prescription
   */
  async generatePrescription(sourceData, context = {}) {
    try {
      logger.info('Starting prescription generation', {
        sourceType: sourceData.type,
        sourceId: sourceData._id,
        encounterId: context.encounterId,
        patientId: context.patientId,
        doctorId: context.doctorId
      });

      const startTime = Date.now();

      // Validate input
      this.validateSourceData(sourceData);

      // Get additional context
      const enrichedContext = await this.enrichContext(context);

      // Create initial prescription record
      const prescription = await this.createInitialPrescription(sourceData, enrichedContext);

      // Extract text for processing
      const textToProcess = this.extractTextFromSource(sourceData);

      // Generate prescription using Gemini
      const generationResult = await geminiService.generatePrescription(
        textToProcess,
        enrichedContext,
        {
          temperature: 0.2,
          maxOutputTokens: 4096
        }
      );

      // Update prescription with generated content
      await this.updatePrescriptionWithGeneratedContent(prescription, generationResult, sourceData);

      // Perform safety checks
      await this.performSafetyChecks(prescription, enrichedContext);

      // Log completion
      const processingTime = Date.now() - startTime;
      logger.info('Prescription generation completed', {
        prescriptionId: prescription._id,
        medicationsExtracted: prescription.medications.length,
        processingTime,
        confidenceScore: generationResult.metadata.confidenceScore
      });

      return prescription;
    } catch (error) {
      logger.error('Prescription generation failed', {
        error: error.message,
        stack: error.stack,
        sourceId: sourceData._id
      });
      throw error;
    }
  }

  /**
   * Generate prescription from clinical note ID
   * @param {string} clinicalNoteId - Clinical note ID
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Generated prescription
   */
  async generateFromClinicalNote(clinicalNoteId, context = {}) {
    try {
      // Get clinical note data
      const clinicalNoteData = await this.getClinicalNoteData(clinicalNoteId);

      if (!clinicalNoteData) {
        throw new NotFoundError('Clinical note not found');
      }

      // Merge context with clinical note data
      const mergedContext = {
        ...context,
        encounterId: clinicalNoteData.encounterId,
        patientId: clinicalNoteData.patientId,
        doctorId: clinicalNoteData.doctorId,
        clinicalNote: clinicalNoteData
      };

      return await this.generatePrescription({
        type: 'clinical_note',
        _id: clinicalNoteId,
        content: this.extractPrescriptionRelevantContent(clinicalNoteData)
      }, mergedContext);
    } catch (error) {
      logger.error('Failed to generate prescription from clinical note', {
        clinicalNoteId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate prescription from transcription ID
   * @param {string} transcriptionId - Transcription ID
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Generated prescription
   */
  async generateFromTranscription(transcriptionId, context = {}) {
    try {
      // Get transcription data
      const transcriptionData = await this.getTranscriptionData(transcriptionId);

      if (!transcriptionData) {
        throw new NotFoundError('Transcription not found');
      }

      // Merge context with transcription data
      const mergedContext = {
        ...context,
        encounterId: transcriptionData.encounterId,
        patientId: transcriptionData.patientId,
        doctorId: transcriptionData.doctorId
      };

      return await this.generatePrescription({
        type: 'transcription',
        _id: transcriptionId,
        content: transcriptionData.transcript
      }, mergedContext);
    } catch (error) {
      logger.error('Failed to generate prescription from transcription', {
        transcriptionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get prescription by ID
   * @param {string} prescriptionId - Prescription ID
   * @returns {Promise<Object>} Prescription
   */
  async getPrescriptionById(prescriptionId) {
    try {
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription) {
        throw new NotFoundError('Prescription not found');
      }
      return prescription;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Failed to get prescription by ID', {
        prescriptionId,
        error: error.message
      });
      throw new InternalServerError('Failed to retrieve prescription');
    }
  }

  /**
   * Get prescription by encounter ID
   * @param {string} encounterId - Encounter ID
   * @returns {Promise<Object>} Prescription
   */
  async getPrescriptionByEncounter(encounterId) {
    try {
      const prescription = await Prescription.findByEncounter(encounterId);
      return prescription;
    } catch (error) {
      logger.error('Failed to get prescription by encounter', {
        encounterId,
        error: error.message
      });
      throw new InternalServerError('Failed to retrieve prescription');
    }
  }

  /**
   * Update prescription
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} updates - Updates to apply
   * @param {string} editorId - ID of the editor
   * @returns {Promise<Object>} Updated prescription
   */
  async updatePrescription(prescriptionId, updates, editorId) {
    try {
      const prescription = await this.getPrescriptionById(prescriptionId);

      // Track changes for audit
      const changes = this.trackChanges(prescription, updates);

      // Apply updates
      Object.assign(prescription, updates);

      // Add edit history
      if (changes.length > 0) {
        await prescription.addEdit(editorId, 'updated', changes, 'Manual edit by user');
      }

      // Re-run safety checks if medications changed
      if (updates.medications) {
        await this.performSafetyChecks(prescription, { patientId: prescription.patientId });
      }

      await prescription.save();

      logger.info('Prescription updated', {
        prescriptionId,
        editorId,
        changesCount: changes.length
      });

      return prescription;
    } catch (error) {
      logger.error('Failed to update prescription', {
        prescriptionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Review prescription
   * @param {string} prescriptionId - Prescription ID
   * @param {string} reviewerId - Reviewer ID
   * @param {string} comments - Review comments
   * @returns {Promise<Object>} Reviewed prescription
   */
  async reviewPrescription(prescriptionId, reviewerId, comments) {
    try {
      const prescription = await this.getPrescriptionById(prescriptionId);
      await prescription.markAsReviewed(reviewerId, comments);

      logger.info('Prescription reviewed', {
        prescriptionId,
        reviewerId
      });

      return prescription;
    } catch (error) {
      logger.error('Failed to review prescription', {
        prescriptionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Approve prescription
   * @param {string} prescriptionId - Prescription ID
   * @param {string} approverId - Approver ID
   * @returns {Promise<Object>} Approved prescription
   */
  async approvePrescription(prescriptionId, approverId) {
    try {
      const prescription = await this.getPrescriptionById(prescriptionId);
      await prescription.markAsApproved(approverId);

      logger.info('Prescription approved', {
        prescriptionId,
        approverId
      });

      return prescription;
    } catch (error) {
      logger.error('Failed to approve prescription', {
        prescriptionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Sign prescription
   * @param {string} prescriptionId - Prescription ID
   * @param {string} signerId - Signer ID
   * @returns {Promise<Object>} Signed prescription
   */
  async signPrescription(prescriptionId, signerId) {
    try {
      const prescription = await this.getPrescriptionById(prescriptionId);
      await prescription.markAsSigned(signerId);

      logger.info('Prescription signed', {
        prescriptionId,
        signerId
      });

      return prescription;
    } catch (error) {
      logger.error('Failed to sign prescription', {
        prescriptionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send prescription to pharmacy
   * @param {string} prescriptionId - Prescription ID
   * @param {string} pharmacyId - Pharmacy ID
   * @returns {Promise<Object>} Sent prescription
   */
  async sendPrescription(prescriptionId, pharmacyId) {
    try {
      const prescription = await this.getPrescriptionById(prescriptionId);

      if (prescription.status !== 'signed') {
        throw new ValidationError('Prescription must be signed before sending');
      }

      await prescription.markAsSent(pharmacyId);

      logger.info('Prescription sent to pharmacy', {
        prescriptionId,
        pharmacyId
      });

      return prescription;
    } catch (error) {
      logger.error('Failed to send prescription', {
        prescriptionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get clinical note data from clinical note service
   * @param {string} clinicalNoteId - Clinical note ID
   * @returns {Promise<Object>} Clinical note data
   */
  async getClinicalNoteData(clinicalNoteId) {
    try {
      const response = await axios.get(
        `${process.env.CLINICAL_NOTE_SERVICE_URL}/api/clinical-notes/${clinicalNoteId}`,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data;
    } catch (error) {
      logger.error('Failed to get clinical note data', {
        clinicalNoteId,
        error: error.message
      });
      throw new InternalServerError('Failed to retrieve clinical note data');
    }
  }

  /**
   * Get transcription data from voice recording service
   * @param {string} transcriptionId - Transcription ID
   * @returns {Promise<Object>} Transcription data
   */
  async getTranscriptionData(transcriptionId) {
    try {
      const response = await axios.get(
        `${process.env.VOICE_RECORDING_SERVICE_URL}/api/transcriptions/${transcriptionId}`,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data;
    } catch (error) {
      logger.error('Failed to get transcription data', {
        transcriptionId,
        error: error.message
      });
      throw new InternalServerError('Failed to retrieve transcription data');
    }
  }

  /**
   * Get patient information
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Patient information
   */
  async getPatientInfo(patientId) {
    try {
      const response = await axios.get(
        `${process.env.PATIENT_SERVICE_URL}/api/patients/${patientId}`,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data;
    } catch (error) {
      logger.warn('Failed to get patient info', {
        patientId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get encounter information
   * @param {string} encounterId - Encounter ID
   * @returns {Promise<Object>} Encounter information
   */
  async getEncounterInfo(encounterId) {
    try {
      const response = await axios.get(
        `${process.env.ENCOUNTER_SERVICE_URL}/api/encounters/${encounterId}`,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data;
    } catch (error) {
      logger.warn('Failed to get encounter info', {
        encounterId,
        error: error.message
      });
      return null;
    }
  }
}

module.exports = new PrescriptionService();