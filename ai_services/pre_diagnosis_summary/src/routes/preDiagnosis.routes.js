const express = require('express');
const { controller, validation } = require('../controllers/preDiagnosis.controller');

const router = express.Router();

/**
 * @route POST /api/pre-diagnosis/generate
 * @desc Generate pre-diagnosis summary
 * @access Private (Doctor)
 */
router.post(
  '/generate',
  validation.generateSummaryValidation,
  controller.generateSummary.bind(controller)
);

/**
 * @route GET /api/pre-diagnosis/:summaryId
 * @desc Get pre-diagnosis summary by ID
 * @access Private (Doctor/Patient with access)
 */
router.get(
  '/:summaryId',
  validation.summaryIdValidation,
  controller.getSummaryById.bind(controller)
);

/**
 * @route GET /api/pre-diagnosis/patient/:patientId
 * @desc Get summaries by patient
 * @access Private (Doctor with patient access)
 */
router.get(
  '/patient/:patientId',
  [
    ...validation.patientIdValidation,
    ...validation.paginationValidation
  ],
  controller.getSummariesByPatient.bind(controller)
);

/**
 * @route GET /api/pre-diagnosis/doctor/:doctorId
 * @desc Get summaries by doctor
 * @access Private (Doctor - own summaries only, Admin - any doctor)
 */
router.get(
  '/doctor/:doctorId',
  [
    ...validation.doctorIdValidation,
    ...validation.paginationValidation
  ],
  controller.getSummariesByDoctor.bind(controller)
);

/**
 * @route PATCH /api/pre-diagnosis/:summaryId/status
 * @desc Update summary status
 * @access Private (Doctor)
 */
router.patch(
  '/:summaryId/status',
  validation.statusUpdateValidation,
  controller.updateSummaryStatus.bind(controller)
);

/**
 * @route DELETE /api/pre-diagnosis/:summaryId
 * @desc Delete summary
 * @access Private (Doctor - creator only, Admin)
 */
router.delete(
  '/:summaryId',
  validation.summaryIdValidation,
  controller.deleteSummary.bind(controller)
);

/**
 * @route GET /api/pre-diagnosis/stats/:doctorId
 * @desc Get summary statistics for doctor
 * @access Private (Doctor - own stats only, Admin - any doctor)
 */
router.get(
  '/stats/:doctorId',
  validation.doctorIdValidation,
  controller.getSummaryStatistics.bind(controller)
);

/**
 * @route GET /api/pre-diagnosis/my/recent
 * @desc Get recent summaries for current user
 * @access Private (Doctor)
 */
router.get(
  '/my/recent',
  controller.getMyRecentSummaries.bind(controller)
);

/**
 * @route GET /api/pre-diagnosis/urgent
 * @desc Get urgent summaries for current user
 * @access Private (Doctor)
 */
router.get(
  '/urgent',
  controller.getUrgentSummaries.bind(controller)
);

module.exports = router;
