const prescriptionService = require('../services/prescription.service');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/error-handler');

class PrescriptionController {
  /**
   * Generate prescription from clinical note
   * @route POST /api/prescriptions/generate/clinical-note
   */
  async generateFromClinicalNote(req, res, next) {
    try {
      const { clinicalNoteId, context = {} } = req.body;

      logger.info('Generating prescription from clinical note', {
        clinicalNoteId,
        userId: req.user.id,
        context
      });

      // Generate prescription
      const prescription = await prescriptionService.generateFromClinicalNote(
        clinicalNoteId,
        {
          ...context,
          doctorId: req.user.id
        }
      );

      res.status(201).json({
        success: true,
        message: 'Prescription generated successfully from clinical note',
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate prescription from transcription
   * @route POST /api/prescriptions/generate/transcription
   */
  async generateFromTranscription(req, res, next) {
    try {
      const { transcriptionId, context = {} } = req.body;

      logger.info('Generating prescription from transcription', {
        transcriptionId,
        userId: req.user.id,
        context
      });

      // Generate prescription
      const prescription = await prescriptionService.generateFromTranscription(
        transcriptionId,
        {
          ...context,
          doctorId: req.user.id
        }
      );

      res.status(201).json({
        success: true,
        message: 'Prescription generated successfully from transcription',
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate prescription from text
   * @route POST /api/prescriptions/generate/text
   */
  async generateFromText(req, res, next) {
    try {
      const { text, context = {} } = req.body;

      if (!text || text.trim().length < 20) {
        throw new ValidationError('Text must be at least 20 characters long');
      }

      logger.info('Generating prescription from text', {
        textLength: text.length,
        userId: req.user.id,
        context
      });

      // Generate prescription
      const prescription = await prescriptionService.generatePrescription(
        {
          type: 'transcription',
          _id: 'text-input',
          content: text
        },
        {
          ...context,
          doctorId: req.user.id,
          encounterId: context.encounterId || 'manual-entry',
          patientId: context.patientId || 'unknown'
        }
      );

      res.status(201).json({
        success: true,
        message: 'Prescription generated successfully from text',
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get prescription by ID
   * @route GET /api/prescriptions/:prescriptionId
   */
  async getPrescription(req, res, next) {
    try {
      const { prescriptionId } = req.params;

      logger.info('Getting prescription', {
        prescriptionId,
        userId: req.user.id
      });

      const prescription = await prescriptionService.getPrescriptionById(prescriptionId);

      // Check access
      if (prescription.doctorId !== req.user.id && req.user.role !== 'admin') {
        throw new ValidationError('Access denied to this prescription');
      }

      res.status(200).json({
        success: true,
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get prescription by encounter ID
   * @route GET /api/prescriptions/encounter/:encounterId
   */
  async getPrescriptionByEncounter(req, res, next) {
    try {
      const { encounterId } = req.params;

      logger.info('Getting prescription by encounter', {
        encounterId,
        userId: req.user.id
      });

      const prescription = await prescriptionService.getPrescriptionByEncounter(encounterId);

      if (!prescription) {
        throw new NotFoundError('Prescription not found for this encounter');
      }

      // Check access
      if (prescription.doctorId !== req.user.id && req.user.role !== 'admin') {
        throw new ValidationError('Access denied to this prescription');
      }

      res.status(200).json({
        success: true,
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update prescription
   * @route PUT /api/prescriptions/:prescriptionId
   */
  async updatePrescription(req, res, next) {
    try {
      const { prescriptionId } = req.params;
      const updates = req.body;

      logger.info('Updating prescription', {
        prescriptionId,
        userId: req.user.id,
        updatesCount: Object.keys(updates).length
      });

      const prescription = await prescriptionService.updatePrescription(
        prescriptionId,
        updates,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Prescription updated successfully',
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Review prescription
   * @route POST /api/prescriptions/:prescriptionId/review
   */
  async reviewPrescription(req, res, next) {
    try {
      const { prescriptionId } = req.params;
      const { comments } = req.body;

      logger.info('Reviewing prescription', {
        prescriptionId,
        reviewerId: req.user.id
      });

      const prescription = await prescriptionService.reviewPrescription(
        prescriptionId,
        req.user.id,
        comments
      );

      res.status(200).json({
        success: true,
        message: 'Prescription reviewed successfully',
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve prescription
   * @route POST /api/prescriptions/:prescriptionId/approve
   */
  async approvePrescription(req, res, next) {
    try {
      const { prescriptionId } = req.params;

      logger.info('Approving prescription', {
        prescriptionId,
        approverId: req.user.id
      });

      const prescription = await prescriptionService.approvePrescription(
        prescriptionId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Prescription approved successfully',
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sign prescription
   * @route POST /api/prescriptions/:prescriptionId/sign
   */
  async signPrescription(req, res, next) {
    try {
      const { prescriptionId } = req.params;

      logger.info('Signing prescription', {
        prescriptionId,
        signerId: req.user.id
      });

      const prescription = await prescriptionService.signPrescription(
        prescriptionId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Prescription signed successfully',
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send prescription to pharmacy
   * @route POST /api/prescriptions/:prescriptionId/send
   */
  async sendPrescription(req, res, next) {
    try {
      const { prescriptionId } = req.params;
      const { pharmacyId } = req.body;

      logger.info('Sending prescription to pharmacy', {
        prescriptionId,
        pharmacyId,
        userId: req.user.id
      });

      const prescription = await prescriptionService.sendPrescription(
        prescriptionId,
        pharmacyId
      );

      res.status(200).json({
        success: true,
        message: 'Prescription sent to pharmacy successfully',
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get prescriptions by patient
   * @route GET /api/prescriptions/patient/:patientId
   */
  async getPrescriptionsByPatient(req, res, next) {
    try {
      const { patientId } = req.params;
      const { limit = 10 } = req.query;

      logger.info('Getting prescriptions by patient', {
        patientId,
        userId: req.user.id,
        limit
      });

      const prescriptions = await prescriptionService.getPrescriptionsByPatient(
        patientId,
        parseInt(limit)
      );

      // Filter by doctor access if not admin
      const accessiblePrescriptions = req.user.role === 'admin' 
        ? prescriptions 
        : prescriptions.filter(prescription => prescription.doctorId === req.user.id);

      res.status(200).json({
        success: true,
        data: accessiblePrescriptions,
        count: accessiblePrescriptions.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get prescriptions by doctor
   * @route GET /api/prescriptions/doctor/:doctorId
   */
  async getPrescriptionsByDoctor(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;

      // Check access - doctors can only see their own prescriptions unless admin
      if (doctorId !== req.user.id && req.user.role !== 'admin') {
        throw new ValidationError('Access denied to other doctor\'s prescriptions');
      }

      logger.info('Getting prescriptions by doctor', {
        doctorId,
        userId: req.user.id,
        startDate,
        endDate
      });

      const prescriptions = await prescriptionService.getPrescriptionsByDoctor(
        doctorId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      res.status(200).json({
        success: true,
        data: prescriptions,
        count: prescriptions.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending prescriptions for review
   * @route GET /api/prescriptions/pending
   */
  async getPendingReview(req, res, next) {
    try {
      const doctorId = req.user.role === 'admin' ? req.query.doctorId : req.user.id;

      logger.info('Getting pending prescriptions', {
        doctorId,
        userId: req.user.id
      });

      const pendingPrescriptions = await prescriptionService.getPendingReview(doctorId);

      res.status(200).json({
        success: true,
        data: pendingPrescriptions,
        count: pendingPrescriptions.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get prescription statistics
   * @route GET /api/prescriptions/stats
   */
  async getStatistics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const doctorId = req.user.role === 'admin' ? req.query.doctorId : req.user.id;

      logger.info('Getting prescription statistics', {
        doctorId,
        startDate,
        endDate,
        userId: req.user.id
      });

      const statistics = await prescriptionService.getStatistics(
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
}

module.exports = new PrescriptionController();
