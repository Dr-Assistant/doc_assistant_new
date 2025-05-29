/**
 * Medical History Routes
 * This module defines the routes for medical history operations
 */

const express = require('express');
const { param, query } = require('express-validator');
const medicalHistoryController = require('../controllers/medical.history.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Get patient's medical history
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid patient ID'),
    query('version').optional().isInt({ min: 1 }).withMessage('Version must be a positive integer'),
    validateRequest
  ],
  authenticate,
  medicalHistoryController.getMedicalHistory
);

// Get medical history versions
router.get(
  '/:id/versions',
  [
    param('id').isUUID().withMessage('Invalid patient ID'),
    validateRequest
  ],
  authenticate,
  medicalHistoryController.getMedicalHistoryVersions
);

// Get medical history by version
router.get(
  '/:id/versions/:version',
  [
    param('id').isUUID().withMessage('Invalid patient ID'),
    param('version').isInt({ min: 1 }).withMessage('Version must be a positive integer'),
    validateRequest
  ],
  authenticate,
  medicalHistoryController.getMedicalHistoryByVersion
);

// Create new medical history
router.post(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid patient ID'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['doctor', 'admin']),
  medicalHistoryController.createMedicalHistory
);

// Update medical history
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid patient ID'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['doctor', 'admin']),
  medicalHistoryController.updateMedicalHistory
);

// Compare medical history versions
router.get(
  '/:id/compare',
  [
    param('id').isUUID().withMessage('Invalid patient ID'),
    query('version1').isInt({ min: 1 }).withMessage('Version 1 must be a positive integer'),
    query('version2').isInt({ min: 1 }).withMessage('Version 2 must be a positive integer'),
    validateRequest
  ],
  authenticate,
  medicalHistoryController.compareVersions
);

module.exports = router; 