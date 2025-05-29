/**
 * ABHA Integration Routes
 * This module defines the routes for ABHA integration operations
 */

const express = require('express');
const { param, body } = require('express-validator');
const abhaService = require('../services/abha.service');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Verify ABHA ID
router.post(
  '/verify',
  [
    body('abhaId').isString().notEmpty().withMessage('ABHA ID is required'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['doctor', 'admin']),
  async (req, res) => {
    const { abhaId } = req.body;
    const result = await abhaService.verifyABHAId(abhaId);
    res.json(result);
  }
);

// Create consent request
router.post(
  '/consent/:patientId',
  [
    param('patientId').isUUID().withMessage('Invalid patient ID'),
    body('abhaId').isString().notEmpty().withMessage('ABHA ID is required'),
    body('purpose').isObject().withMessage('Purpose must be an object'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['doctor', 'admin']),
  async (req, res) => {
    const { patientId } = req.params;
    const { abhaId, purpose } = req.body;
    const result = await abhaService.createConsentRequest(patientId, abhaId, purpose);
    res.json(result);
  }
);

// Sync patient data
router.post(
  '/sync/:patientId',
  [
    param('patientId').isUUID().withMessage('Invalid patient ID'),
    body('patientData').isObject().withMessage('Patient data must be an object'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['doctor', 'admin']),
  async (req, res) => {
    const { patientId } = req.params;
    const { patientData } = req.body;
    const result = await abhaService.syncPatientData(patientId, patientData);
    res.json(result);
  }
);

// Consent callback endpoint
router.post(
  '/consent/callback',
  [
    body('consentId').isString().notEmpty().withMessage('Consent ID is required'),
    body('status').isString().notEmpty().withMessage('Status is required'),
    validateRequest
  ],
  async (req, res) => {
    const result = await abhaService.handleConsentCallback(req.body);
    res.json(result);
  }
);

// Health record callback endpoint
router.post(
  '/health-records/callback',
  [
    body('patientId').isUUID().withMessage('Invalid patient ID'),
    body('records').isArray().withMessage('Records must be an array'),
    validateRequest
  ],
  async (req, res) => {
    const result = await abhaService.handleHealthRecordCallback(req.body);
    res.json(result);
  }
);

module.exports = router; 