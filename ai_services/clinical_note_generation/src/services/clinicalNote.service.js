const ClinicalNote = require('../models/ClinicalNote');
const geminiService = require('./gemini.service');
const logger = require('../utils/logger');
const axios = require('axios');
const { InternalServerError, ValidationError, NotFoundError } = require('../utils/error-handler');

class ClinicalNoteService {
  constructor() {
    this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    this.processingTimeout = parseInt(process.env.PROCESSING_TIMEOUT) || 60000;
    this.confidenceThreshold = parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.7;
  }

  /**
   * Generate clinical note from transcription
   * @param {Object} transcriptionData - Transcription data
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Generated clinical note
   */
  async generateClinicalNote(transcriptionData, context = {}) {
    try {
      logger.info('Starting clinical note generation', {
        transcriptionId: transcriptionData._id,
        encounterId: context.encounterId,
        patientId: context.patientId,
        doctorId: context.doctorId
      });

      const startTime = Date.now();

      // Validate input
      this.validateTranscriptionData(transcriptionData);

      // Get additional context
      const enrichedContext = await this.enrichContext(context);

      // Create initial clinical note record
      const clinicalNote = await this.createInitialNote(transcriptionData, enrichedContext);

      // Generate SOAP note using Gemini
      const generationResult = await geminiService.generateClinicalNote(
        transcriptionData.transcript,
        enrichedContext,
        {
          temperature: 0.3,
          maxOutputTokens: 8192
        }
      );

      // Update clinical note with generated content
      await this.updateNoteWithGeneratedContent(clinicalNote, generationResult, transcriptionData);

      // Perform quality checks
      await this.performQualityChecks(clinicalNote);

      // Log completion
      const processingTime = Date.now() - startTime;
      logger.info('Clinical note generation completed', {
        clinicalNoteId: clinicalNote._id,
        processingTime,
        confidenceScore: generationResult.metadata.confidenceScore
      });

      return clinicalNote;
    } catch (error) {
      logger.error('Clinical note generation failed', {
        error: error.message,
        stack: error.stack,
        transcriptionId: transcriptionData._id
      });
      throw error;
    }
  }

  /**
   * Generate clinical note from transcription ID
   * @param {string} transcriptionId - Transcription ID
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Generated clinical note
   */
  async generateFromTranscriptionId(transcriptionId, context = {}) {
    try {
      // Get transcription data from voice recording service
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

      return await this.generateClinicalNote(transcriptionData, mergedContext);
    } catch (error) {
      logger.error('Failed to generate clinical note from transcription ID', {
        transcriptionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get clinical note by ID
   * @param {string} clinicalNoteId - Clinical note ID
   * @returns {Promise<Object>} Clinical note
   */
  async getClinicalNoteById(clinicalNoteId) {
    try {
      const clinicalNote = await ClinicalNote.findById(clinicalNoteId);
      if (!clinicalNote) {
        throw new NotFoundError('Clinical note not found');
      }
      return clinicalNote;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Failed to get clinical note by ID', {
        clinicalNoteId,
        error: error.message
      });
      throw new InternalServerError('Failed to retrieve clinical note');
    }
  }

  /**
   * Get clinical note by encounter ID
   * @param {string} encounterId - Encounter ID
   * @returns {Promise<Object>} Clinical note
   */
  async getClinicalNoteByEncounter(encounterId) {
    try {
      const clinicalNote = await ClinicalNote.findByEncounter(encounterId);
      return clinicalNote;
    } catch (error) {
      logger.error('Failed to get clinical note by encounter', {
        encounterId,
        error: error.message
      });
      throw new InternalServerError('Failed to retrieve clinical note');
    }
  }

  /**
   * Update clinical note
   * @param {string} clinicalNoteId - Clinical note ID
   * @param {Object} updates - Updates to apply
   * @param {string} editorId - ID of the editor
   * @returns {Promise<Object>} Updated clinical note
   */
  async updateClinicalNote(clinicalNoteId, updates, editorId) {
    try {
      const clinicalNote = await this.getClinicalNoteById(clinicalNoteId);

      // Track changes for audit
      const changes = this.trackChanges(clinicalNote, updates);

      // Apply updates
      Object.assign(clinicalNote, updates);

      // Add edit history
      if (changes.length > 0) {
        await clinicalNote.addEdit(editorId, 'manual_edit', changes, 'Manual edit by user');
      }

      await clinicalNote.save();

      logger.info('Clinical note updated', {
        clinicalNoteId,
        editorId,
        changesCount: changes.length
      });

      return clinicalNote;
    } catch (error) {
      logger.error('Failed to update clinical note', {
        clinicalNoteId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Review clinical note
   * @param {string} clinicalNoteId - Clinical note ID
   * @param {string} reviewerId - Reviewer ID
   * @param {string} comments - Review comments
   * @returns {Promise<Object>} Reviewed clinical note
   */
  async reviewClinicalNote(clinicalNoteId, reviewerId, comments) {
    try {
      const clinicalNote = await this.getClinicalNoteById(clinicalNoteId);
      await clinicalNote.markAsReviewed(reviewerId, comments);

      logger.info('Clinical note reviewed', {
        clinicalNoteId,
        reviewerId
      });

      return clinicalNote;
    } catch (error) {
      logger.error('Failed to review clinical note', {
        clinicalNoteId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Approve clinical note
   * @param {string} clinicalNoteId - Clinical note ID
   * @param {string} approverId - Approver ID
   * @returns {Promise<Object>} Approved clinical note
   */
  async approveClinicalNote(clinicalNoteId, approverId) {
    try {
      const clinicalNote = await this.getClinicalNoteById(clinicalNoteId);
      await clinicalNote.markAsApproved(approverId);

      logger.info('Clinical note approved', {
        clinicalNoteId,
        approverId
      });

      return clinicalNote;
    } catch (error) {
      logger.error('Failed to approve clinical note', {
        clinicalNoteId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Sign clinical note
   * @param {string} clinicalNoteId - Clinical note ID
   * @param {string} signerId - Signer ID
   * @returns {Promise<Object>} Signed clinical note
   */
  async signClinicalNote(clinicalNoteId, signerId) {
    try {
      const clinicalNote = await this.getClinicalNoteById(clinicalNoteId);
      await clinicalNote.markAsSigned(signerId);

      logger.info('Clinical note signed', {
        clinicalNoteId,
        signerId
      });

      return clinicalNote;
    } catch (error) {
      logger.error('Failed to sign clinical note', {
        clinicalNoteId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get clinical notes by patient
   * @param {string} patientId - Patient ID
   * @param {number} limit - Limit number of results
   * @returns {Promise<Array>} Clinical notes
   */
  async getClinicalNotesByPatient(patientId, limit = 10) {
    try {
      const clinicalNotes = await ClinicalNote.findByPatient(patientId, limit);
      return clinicalNotes;
    } catch (error) {
      logger.error('Failed to get clinical notes by patient', {
        patientId,
        error: error.message
      });
      throw new InternalServerError('Failed to retrieve clinical notes');
    }
  }

  /**
   * Get clinical notes by doctor
   * @param {string} doctorId - Doctor ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Clinical notes
   */
  async getClinicalNotesByDoctor(doctorId, startDate, endDate) {
    try {
      const clinicalNotes = await ClinicalNote.findByDoctor(doctorId, startDate, endDate);
      return clinicalNotes;
    } catch (error) {
      logger.error('Failed to get clinical notes by doctor', {
        doctorId,
        error: error.message
      });
      throw new InternalServerError('Failed to retrieve clinical notes');
    }
  }

  /**
   * Get pending clinical notes for review
   * @param {string} doctorId - Doctor ID (optional)
   * @returns {Promise<Array>} Pending clinical notes
   */
  async getPendingReview(doctorId) {
    try {
      const clinicalNotes = await ClinicalNote.findPendingReview(doctorId);
      return clinicalNotes;
    } catch (error) {
      logger.error('Failed to get pending clinical notes', {
        doctorId,
        error: error.message
      });
      throw new InternalServerError('Failed to retrieve pending clinical notes');
    }
  }

  /**
   * Get clinical note statistics
   * @param {string} doctorId - Doctor ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Statistics
   */
  async getStatistics(doctorId, startDate, endDate) {
    try {
      const statistics = await ClinicalNote.getStatistics(doctorId, startDate, endDate);
      return statistics;
    } catch (error) {
      logger.error('Failed to get clinical note statistics', {
        doctorId,
        error: error.message
      });
      throw new InternalServerError('Failed to retrieve statistics');
    }
  }

  /**
   * Validate transcription data
   * @param {Object} transcriptionData - Transcription data to validate
   */
  validateTranscriptionData(transcriptionData) {
    if (!transcriptionData) {
      throw new ValidationError('Transcription data is required');
    }

    if (!transcriptionData.transcript || transcriptionData.transcript.trim().length === 0) {
      throw new ValidationError('Transcription text is required');
    }

    if (transcriptionData.transcript.length < 50) {
      throw new ValidationError('Transcription text is too short for clinical note generation');
    }

    if (!transcriptionData.encounterId || !transcriptionData.patientId || !transcriptionData.doctorId) {
      throw new ValidationError('Encounter ID, Patient ID, and Doctor ID are required');
    }
  }

  /**
   * Enrich context with additional data
   * @param {Object} context - Base context
   * @returns {Promise<Object>} Enriched context
   */
  async enrichContext(context) {
    try {
      const enriched = { ...context };

      // Get patient information if available
      if (context.patientId && !context.patientInfo) {
        try {
          enriched.patientInfo = await this.getPatientInfo(context.patientId);
        } catch (error) {
          logger.warn('Failed to get patient info', { patientId: context.patientId });
        }
      }

      // Get encounter information if available
      if (context.encounterId && !context.encounterInfo) {
        try {
          enriched.encounterInfo = await this.getEncounterInfo(context.encounterId);
        } catch (error) {
          logger.warn('Failed to get encounter info', { encounterId: context.encounterId });
        }
      }

      return enriched;
    } catch (error) {
      logger.warn('Failed to enrich context', { error: error.message });
      return context;
    }
  }

  /**
   * Create initial clinical note record
   * @param {Object} transcriptionData - Transcription data
   * @param {Object} context - Context data
   * @returns {Promise<Object>} Created clinical note
   */
  async createInitialNote(transcriptionData, context) {
    const clinicalNote = new ClinicalNote({
      encounterId: transcriptionData.encounterId,
      patientId: transcriptionData.patientId,
      doctorId: transcriptionData.doctorId,
      transcriptionId: transcriptionData._id,
      status: 'generating',
      noteType: context.noteType || 'soap',
      priority: context.priority || 'normal',
      rawTranscription: transcriptionData.transcript,
      subjective: {
        chiefComplaint: '',
        historyOfPresentIllness: ''
      },
      assessment: {
        clinicalImpression: ''
      },
      plan: {
        followUp: {}
      },
      aiMetadata: {
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
        version: '1.0',
        confidenceScore: 0
      }
    });

    await clinicalNote.save();
    return clinicalNote;
  }

  /**
   * Update clinical note with generated content
   * @param {Object} clinicalNote - Clinical note to update
   * @param {Object} generationResult - Generation result from Gemini
   * @param {Object} transcriptionData - Original transcription data
   */
  async updateNoteWithGeneratedContent(clinicalNote, generationResult, transcriptionData) {
    // Update SOAP note content
    clinicalNote.subjective = generationResult.soapNote.subjective;
    clinicalNote.objective = generationResult.soapNote.objective;
    clinicalNote.assessment = generationResult.soapNote.assessment;
    clinicalNote.plan = generationResult.soapNote.plan;

    // Update AI metadata
    clinicalNote.aiMetadata = generationResult.metadata;

    // Update status based on confidence
    if (generationResult.metadata.confidenceScore >= this.confidenceThreshold) {
      clinicalNote.status = 'draft';
    } else {
      clinicalNote.status = 'review';
      await clinicalNote.addComplianceFlag(
        'low_confidence',
        `AI confidence score (${generationResult.metadata.confidenceScore}) below threshold (${this.confidenceThreshold})`,
        'warning'
      );
    }

    // Store processed transcription
    clinicalNote.processedTranscription = transcriptionData.transcript;

    await clinicalNote.save();
  }

  /**
   * Perform quality checks on clinical note
   * @param {Object} clinicalNote - Clinical note to check
   */
  async performQualityChecks(clinicalNote) {
    const flags = [];

    // Check for missing required sections
    if (!clinicalNote.subjective?.chiefComplaint) {
      flags.push({
        type: 'missing_chief_complaint',
        description: 'Chief complaint is missing or empty',
        severity: 'warning'
      });
    }

    if (!clinicalNote.assessment?.clinicalImpression) {
      flags.push({
        type: 'missing_assessment',
        description: 'Clinical impression is missing or empty',
        severity: 'error'
      });
    }

    if (!clinicalNote.plan?.followUp && (!clinicalNote.plan?.treatments || clinicalNote.plan.treatments.length === 0)) {
      flags.push({
        type: 'missing_plan',
        description: 'Treatment plan or follow-up instructions are missing',
        severity: 'warning'
      });
    }

    // Check for very short content
    const totalWordCount = clinicalNote.wordCount;
    if (totalWordCount < 50) {
      flags.push({
        type: 'insufficient_content',
        description: 'Clinical note content appears insufficient',
        severity: 'warning'
      });
    }

    // Add compliance flags
    for (const flag of flags) {
      await clinicalNote.addComplianceFlag(flag.type, flag.description, flag.severity);
    }
  }

  /**
   * Track changes between old and new clinical note data
   * @param {Object} oldNote - Original clinical note
   * @param {Object} updates - Updates to apply
   * @returns {Array} Array of changes
   */
  trackChanges(oldNote, updates) {
    const changes = [];

    // Track changes in main sections
    const sectionsToTrack = ['subjective', 'objective', 'assessment', 'plan'];

    for (const section of sectionsToTrack) {
      if (updates[section]) {
        const oldSection = oldNote[section] || {};
        const newSection = updates[section];

        for (const [field, newValue] of Object.entries(newSection)) {
          const oldValue = oldSection[field];
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({
              field: `${section}.${field}`,
              oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue || ''),
              newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue || '')
            });
          }
        }
      }
    }

    return changes;
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

  /**
   * Regenerate clinical note with different parameters
   * @param {string} clinicalNoteId - Clinical note ID
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Regenerated clinical note
   */
  async regenerateClinicalNote(clinicalNoteId, options = {}) {
    try {
      const clinicalNote = await this.getClinicalNoteById(clinicalNoteId);

      if (!clinicalNote.rawTranscription) {
        throw new ValidationError('Cannot regenerate: original transcription not available');
      }

      logger.info('Regenerating clinical note', {
        clinicalNoteId,
        options
      });

      // Get context from existing note
      const context = {
        encounterId: clinicalNote.encounterId,
        patientId: clinicalNote.patientId,
        doctorId: clinicalNote.doctorId,
        noteType: clinicalNote.noteType,
        priority: clinicalNote.priority
      };

      // Generate new content
      const generationResult = await geminiService.generateClinicalNote(
        clinicalNote.rawTranscription,
        context,
        options
      );

      // Update with new content
      await this.updateNoteWithGeneratedContent(clinicalNote, generationResult, {
        transcript: clinicalNote.rawTranscription
      });

      // Add audit entry
      clinicalNote.addAuditEntry('regenerated', context.doctorId, { options });

      await clinicalNote.save();

      logger.info('Clinical note regenerated', {
        clinicalNoteId,
        newConfidenceScore: generationResult.metadata.confidenceScore
      });

      return clinicalNote;
    } catch (error) {
      logger.error('Failed to regenerate clinical note', {
        clinicalNoteId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new ClinicalNoteService();
