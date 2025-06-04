const preDiagnosisSummaryService = require('../services/preDiagnosisSummary.service');
const logger = require('../utils/logger');
const { ValidationError } = require('../middleware/errorHandler');
const { body, param, query, validationResult } = require('express-validator');

class PreDiagnosisController {
  /**
   * Generate pre-diagnosis summary
   * @route POST /api/pre-diagnosis/generate
   */
  async generateSummary(req, res, next) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
      }

      const { patientId, encounterId, appointmentId, questionnaireData, priority, urgency } = req.body;

      logger.info('Generating pre-diagnosis summary', {
        patientId,
        encounterId,
        userId: req.user.id,
        hasQuestionnaire: !!(questionnaireData && Object.keys(questionnaireData).length > 0)
      });

      // Generate summary
      const summary = await preDiagnosisSummaryService.generateSummary(
        {
          patientId,
          encounterId,
          appointmentId,
          questionnaireData,
          priority,
          urgency
        },
        {
          doctorId: req.user.id
        }
      );

      res.status(201).json({
        success: true,
        message: 'Pre-diagnosis summary generated successfully',
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pre-diagnosis summary by ID
   * @route GET /api/pre-diagnosis/:summaryId
   */
  async getSummaryById(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
      }

      const { summaryId } = req.params;

      logger.info('Getting pre-diagnosis summary by ID', {
        summaryId,
        userId: req.user.id
      });

      const summary = await preDiagnosisSummaryService.getSummaryById(summaryId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Pre-diagnosis summary retrieved successfully',
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get summaries by patient
   * @route GET /api/pre-diagnosis/patient/:patientId
   */
  async getSummariesByPatient(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
      }

      const { patientId } = req.params;
      const { limit, offset, status, startDate, endDate } = req.query;

      logger.info('Getting summaries by patient', {
        patientId,
        userId: req.user.id,
        limit,
        offset
      });

      const summaries = await preDiagnosisSummaryService.getSummariesByPatient(patientId, {
        limit: parseInt(limit) || 10,
        offset: parseInt(offset) || 0,
        status,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        message: 'Patient summaries retrieved successfully',
        data: summaries,
        pagination: {
          limit: parseInt(limit) || 10,
          offset: parseInt(offset) || 0,
          total: summaries.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get summaries by doctor
   * @route GET /api/pre-diagnosis/doctor/:doctorId
   */
  async getSummariesByDoctor(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
      }

      const { doctorId } = req.params;
      const { limit, offset, status, urgency, startDate, endDate } = req.query;

      // Check access - doctors can only see their own summaries unless admin
      if (doctorId !== req.user.id && req.user.role !== 'admin') {
        throw new ValidationError('Access denied to other doctor\'s summaries');
      }

      logger.info('Getting summaries by doctor', {
        doctorId,
        userId: req.user.id,
        limit,
        offset
      });

      const summaries = await preDiagnosisSummaryService.getSummariesByDoctor(doctorId, {
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
        status,
        urgency,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        message: 'Doctor summaries retrieved successfully',
        data: summaries,
        pagination: {
          limit: parseInt(limit) || 20,
          offset: parseInt(offset) || 0,
          total: summaries.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update summary status
   * @route PATCH /api/pre-diagnosis/:summaryId/status
   */
  async updateSummaryStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
      }

      const { summaryId } = req.params;
      const { status } = req.body;

      logger.info('Updating summary status', {
        summaryId,
        newStatus: status,
        userId: req.user.id
      });

      const summary = await preDiagnosisSummaryService.updateSummaryStatus(
        summaryId,
        status,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Summary status updated successfully',
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete summary
   * @route DELETE /api/pre-diagnosis/:summaryId
   */
  async deleteSummary(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
      }

      const { summaryId } = req.params;

      logger.info('Deleting summary', {
        summaryId,
        userId: req.user.id
      });

      await preDiagnosisSummaryService.deleteSummary(summaryId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Summary deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get summary statistics
   * @route GET /api/pre-diagnosis/stats/:doctorId
   */
  async getSummaryStatistics(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
      }

      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;

      // Check access
      if (doctorId !== req.user.id && req.user.role !== 'admin') {
        throw new ValidationError('Access denied to other doctor\'s statistics');
      }

      logger.info('Getting summary statistics', {
        doctorId,
        userId: req.user.id,
        startDate,
        endDate
      });

      const stats = await preDiagnosisSummaryService.getSummaryStatistics(doctorId, {
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        message: 'Summary statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get my recent summaries
   * @route GET /api/pre-diagnosis/my/recent
   */
  async getMyRecentSummaries(req, res, next) {
    try {
      const { limit = 10, urgency } = req.query;

      logger.info('Getting recent summaries for user', {
        userId: req.user.id,
        limit
      });

      const summaries = await preDiagnosisSummaryService.getSummariesByDoctor(req.user.id, {
        limit: parseInt(limit),
        offset: 0,
        urgency
      });

      res.status(200).json({
        success: true,
        message: 'Recent summaries retrieved successfully',
        data: summaries
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get urgent summaries
   * @route GET /api/pre-diagnosis/urgent
   */
  async getUrgentSummaries(req, res, next) {
    try {
      const { limit = 20 } = req.query;

      logger.info('Getting urgent summaries for user', {
        userId: req.user.id,
        limit
      });

      const summaries = await preDiagnosisSummaryService.getSummariesByDoctor(req.user.id, {
        limit: parseInt(limit),
        offset: 0,
        urgency: 'urgent'
      });

      res.status(200).json({
        success: true,
        message: 'Urgent summaries retrieved successfully',
        data: summaries
      });
    } catch (error) {
      next(error);
    }
  }
}

// Validation middleware
const generateSummaryValidation = [
  body('patientId')
    .isUUID()
    .withMessage('Patient ID must be a valid UUID'),
  body('encounterId')
    .optional()
    .isUUID()
    .withMessage('Encounter ID must be a valid UUID'),
  body('appointmentId')
    .optional()
    .isUUID()
    .withMessage('Appointment ID must be a valid UUID'),
  body('questionnaireData')
    .optional()
    .isObject()
    .withMessage('Questionnaire data must be an object'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Urgency must be one of: low, medium, high, urgent')
];

const summaryIdValidation = [
  param('summaryId')
    .isMongoId()
    .withMessage('Summary ID must be a valid MongoDB ObjectId')
];

const patientIdValidation = [
  param('patientId')
    .isUUID()
    .withMessage('Patient ID must be a valid UUID')
];

const doctorIdValidation = [
  param('doctorId')
    .isUUID()
    .withMessage('Doctor ID must be a valid UUID')
];

const statusUpdateValidation = [
  ...summaryIdValidation,
  body('status')
    .isIn(['generating', 'completed', 'failed', 'expired'])
    .withMessage('Status must be one of: generating, completed, failed, expired')
];

const paginationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

module.exports = {
  controller: new PreDiagnosisController(),
  validation: {
    generateSummaryValidation,
    summaryIdValidation,
    patientIdValidation,
    doctorIdValidation,
    statusUpdateValidation,
    paginationValidation
  }
};
