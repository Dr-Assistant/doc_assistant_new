/**
 * Patient Routes
 * This module defines the routes for patient operations
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const patientController = require('../controllers/patient.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all patients
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'inactive', 'deceased']).withMessage('Invalid status'),
    query('sort').optional().isIn(['first_name', 'last_name', 'date_of_birth', 'created_at', 'updated_at']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['ASC', 'DESC']).withMessage('Order must be ASC or DESC'),
    validateRequest
  ],
  authenticate,
  patientController.getAllPatients
);

// Get patient by ID
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid patient ID'),
    validateRequest
  ],
  authenticate,
  patientController.getPatientById
);

// Create a new patient
router.post(
  '/',
  [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('date_of_birth').isDate().withMessage('Date of birth must be a valid date'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('mrn').optional().isString().withMessage('MRN must be a string'),
    body('abha_id').optional().isString().withMessage('ABHA ID must be a string'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('email').optional().isEmail().withMessage('Email must be valid'),
    body('address').optional().isObject().withMessage('Address must be an object'),
    body('emergency_contact').optional().isObject().withMessage('Emergency contact must be an object'),
    body('blood_group').optional().isString().withMessage('Blood group must be a string'),
    body('allergies').optional().isArray().withMessage('Allergies must be an array'),
    body('status').optional().isIn(['active', 'inactive', 'deceased']).withMessage('Status must be active, inactive, or deceased'),
    validateRequest
  ],
  authenticate,
  patientController.createPatient
);

// Update patient
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid patient ID'),
    body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
    body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('date_of_birth').optional().isDate().withMessage('Date of birth must be a valid date'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('mrn').optional().isString().withMessage('MRN must be a string'),
    body('abha_id').optional().isString().withMessage('ABHA ID must be a string'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('email').optional().isEmail().withMessage('Email must be valid'),
    body('address').optional().isObject().withMessage('Address must be an object'),
    body('emergency_contact').optional().isObject().withMessage('Emergency contact must be an object'),
    body('blood_group').optional().isString().withMessage('Blood group must be a string'),
    body('allergies').optional().isArray().withMessage('Allergies must be an array'),
    body('status').optional().isIn(['active', 'inactive', 'deceased']).withMessage('Status must be active, inactive, or deceased'),
    validateRequest
  ],
  authenticate,
  patientController.updatePatient
);

// Delete patient
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid patient ID'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['doctor', 'admin']),
  patientController.deletePatient
);

// Get patient medical history
router.get(
  '/:id/medical-history',
  [
    param('id').isUUID().withMessage('Invalid patient ID'),
    validateRequest
  ],
  authenticate,
  patientController.getPatientMedicalHistory
);

// Update patient medical history
router.put(
  '/:id/medical-history',
  [
    param('id').isUUID().withMessage('Invalid patient ID'),
    body().isObject().withMessage('Request body must be an object'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['doctor', 'admin']),
  patientController.updatePatientMedicalHistory
);

module.exports = router;
