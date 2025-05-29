const clinicalNoteService = require('../services/clinicalNote.service');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/error-handler');

class ClinicalNoteController {
  /**
   * Generate clinical note from transcription
   * @route POST /api/clinical-notes/generate
   */
  async generateClinicalNote(req, res, next) {
    try {
      const { transcriptionId, context = {} } = req.body;

      logger.info('Generating clinical note', {
        transcriptionId,
        userId: req.user.id,
        context
      });

      // Generate clinical note
      const clinicalNote = await clinicalNoteService.generateFromTranscriptionId(
        transcriptionId,
        {
          ...context,
          doctorId: req.user.id
        }
      );

      res.status(201).json({
        success: true,
        message: 'Clinical note generated successfully',
        data: clinicalNote
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get clinical note by ID
   * @route GET /api/clinical-notes/:clinicalNoteId
   */
  async getClinicalNote(req, res, next) {
    try {
      const { clinicalNoteId } = req.params;

      logger.info('Getting clinical note', {
        clinicalNoteId,
        userId: req.user.id
      });

      const clinicalNote = await clinicalNoteService.getClinicalNoteById(clinicalNoteId);

      // Check access
      if (clinicalNote.doctorId !== req.user.id && req.user.role !== 'admin') {
        throw new ValidationError('Access denied to this clinical note');
      }

      res.status(200).json({
        success: true,
        data: clinicalNote
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get clinical note by encounter ID
   * @route GET /api/clinical-notes/encounter/:encounterId
   */
  async getClinicalNoteByEncounter(req, res, next) {
    try {
      const { encounterId } = req.params;

      logger.info('Getting clinical note by encounter', {
        encounterId,
        userId: req.user.id
      });

      const clinicalNote = await clinicalNoteService.getClinicalNoteByEncounter(encounterId);

      if (!clinicalNote) {
        throw new NotFoundError('Clinical note not found for this encounter');
      }

      // Check access
      if (clinicalNote.doctorId !== req.user.id && req.user.role !== 'admin') {
        throw new ValidationError('Access denied to this clinical note');
      }

      res.status(200).json({
        success: true,
        data: clinicalNote
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update clinical note
   * @route PUT /api/clinical-notes/:clinicalNoteId
   */
  async updateClinicalNote(req, res, next) {
    try {
      const { clinicalNoteId } = req.params;
      const updates = req.body;

      logger.info('Updating clinical note', {
        clinicalNoteId,
        userId: req.user.id,
        updatesCount: Object.keys(updates).length
      });

      const clinicalNote = await clinicalNoteService.updateClinicalNote(
        clinicalNoteId,
        updates,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Clinical note updated successfully',
        data: clinicalNote
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Review clinical note
   * @route POST /api/clinical-notes/:clinicalNoteId/review
   */
  async reviewClinicalNote(req, res, next) {
    try {
      const { clinicalNoteId } = req.params;
      const { comments } = req.body;

      logger.info('Reviewing clinical note', {
        clinicalNoteId,
        reviewerId: req.user.id
      });

      const clinicalNote = await clinicalNoteService.reviewClinicalNote(
        clinicalNoteId,
        req.user.id,
        comments
      );

      res.status(200).json({
        success: true,
        message: 'Clinical note reviewed successfully',
        data: clinicalNote
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve clinical note
   * @route POST /api/clinical-notes/:clinicalNoteId/approve
   */
  async approveClinicalNote(req, res, next) {
    try {
      const { clinicalNoteId } = req.params;

      logger.info('Approving clinical note', {
        clinicalNoteId,
        approverId: req.user.id
      });

      const clinicalNote = await clinicalNoteService.approveClinicalNote(
        clinicalNoteId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Clinical note approved successfully',
        data: clinicalNote
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sign clinical note
   * @route POST /api/clinical-notes/:clinicalNoteId/sign
   */
  async signClinicalNote(req, res, next) {
    try {
      const { clinicalNoteId } = req.params;

      logger.info('Signing clinical note', {
        clinicalNoteId,
        signerId: req.user.id
      });

      const clinicalNote = await clinicalNoteService.signClinicalNote(
        clinicalNoteId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Clinical note signed successfully',
        data: clinicalNote
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get clinical notes by patient
   * @route GET /api/clinical-notes/patient/:patientId
   */
  async getClinicalNotesByPatient(req, res, next) {
    try {
      const { patientId } = req.params;
      const { limit = 10 } = req.query;

      logger.info('Getting clinical notes by patient', {
        patientId,
        userId: req.user.id,
        limit
      });

      const clinicalNotes = await clinicalNoteService.getClinicalNotesByPatient(
        patientId,
        parseInt(limit)
      );

      // Filter by doctor access if not admin
      const accessibleNotes = req.user.role === 'admin' 
        ? clinicalNotes 
        : clinicalNotes.filter(note => note.doctorId === req.user.id);

      res.status(200).json({
        success: true,
        data: accessibleNotes,
        count: accessibleNotes.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get clinical notes by doctor
   * @route GET /api/clinical-notes/doctor/:doctorId
   */
  async getClinicalNotesByDoctor(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;

      // Check access - doctors can only see their own notes unless admin
      if (doctorId !== req.user.id && req.user.role !== 'admin') {
        throw new ValidationError('Access denied to other doctor\'s notes');
      }

      logger.info('Getting clinical notes by doctor', {
        doctorId,
        userId: req.user.id,
        startDate,
        endDate
      });

      const clinicalNotes = await clinicalNoteService.getClinicalNotesByDoctor(
        doctorId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      res.status(200).json({
        success: true,
        data: clinicalNotes,
        count: clinicalNotes.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending clinical notes for review
   * @route GET /api/clinical-notes/pending
   */
  async getPendingReview(req, res, next) {
    try {
      const doctorId = req.user.role === 'admin' ? req.query.doctorId : req.user.id;

      logger.info('Getting pending clinical notes', {
        doctorId,
        userId: req.user.id
      });

      const pendingNotes = await clinicalNoteService.getPendingReview(doctorId);

      res.status(200).json({
        success: true,
        data: pendingNotes,
        count: pendingNotes.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get clinical note statistics
   * @route GET /api/clinical-notes/stats
   */
  async getStatistics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const doctorId = req.user.role === 'admin' ? req.query.doctorId : req.user.id;

      logger.info('Getting clinical note statistics', {
        doctorId,
        startDate,
        endDate,
        userId: req.user.id
      });

      const statistics = await clinicalNoteService.getStatistics(
        doctorId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Regenerate clinical note
   * @route POST /api/clinical-notes/:clinicalNoteId/regenerate
   */
  async regenerateClinicalNote(req, res, next) {
    try {
      const { clinicalNoteId } = req.params;
      const { options = {} } = req.body;

      logger.info('Regenerating clinical note', {
        clinicalNoteId,
        userId: req.user.id,
        options
      });

      const clinicalNote = await clinicalNoteService.regenerateClinicalNote(
        clinicalNoteId,
        options
      );

      res.status(200).json({
        success: true,
        message: 'Clinical note regenerated successfully',
        data: clinicalNote
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClinicalNoteController();
