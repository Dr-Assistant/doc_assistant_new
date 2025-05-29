/**
 * Appointment Routes
 * This module defines the routes for appointment operations
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const appointmentController = require('../controllers/appointment.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all appointments
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('doctorId').optional().isUUID().withMessage('Doctor ID must be a valid UUID'),
    query('patientId').optional().isUUID().withMessage('Patient ID must be a valid UUID'),
    query('status').optional().isIn(['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status'),
    query('type').optional().isIn(['in_person', 'telemedicine', 'follow_up', 'urgent', 'routine']).withMessage('Invalid appointment type'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
    query('sort').optional().isIn(['start_time', 'end_time', 'status', 'created_at']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['ASC', 'DESC']).withMessage('Order must be ASC or DESC'),
    validateRequest
  ],
  authenticate,
  appointmentController.getAllAppointments
);

// Get appointments by date range
router.get(
  '/date-range',
  [
    query('startDate').isISO8601().withMessage('Start date is required and must be a valid ISO 8601 date'),
    query('endDate').isISO8601().withMessage('End date is required and must be a valid ISO 8601 date'),
    query('doctorId').optional().isUUID().withMessage('Doctor ID must be a valid UUID'),
    query('patientId').optional().isUUID().withMessage('Patient ID must be a valid UUID'),
    query('status').optional().isIn(['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status'),
    validateRequest
  ],
  authenticate,
  appointmentController.getAppointmentsByDateRange
);

// Get today's appointments
router.get(
  '/today',
  [
    query('doctorId').optional().isUUID().withMessage('Doctor ID must be a valid UUID'),
    query('patientId').optional().isUUID().withMessage('Patient ID must be a valid UUID'),
    query('status').optional().isIn(['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status'),
    validateRequest
  ],
  authenticate,
  appointmentController.getTodayAppointments
);

// Get appointment by ID
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid appointment ID'),
    validateRequest
  ],
  authenticate,
  appointmentController.getAppointmentById
);

// Create a new appointment
router.post(
  '/',
  [
    body('doctor_id').isUUID().withMessage('Doctor ID is required and must be a valid UUID'),
    body('patient_id').isUUID().withMessage('Patient ID is required and must be a valid UUID'),
    body('start_time').isISO8601().withMessage('Start time is required and must be a valid ISO 8601 date'),
    body('end_time').isISO8601().withMessage('End time is required and must be a valid ISO 8601 date'),
    body('appointment_type').isIn(['in_person', 'telemedicine', 'follow_up', 'urgent', 'routine']).withMessage('Invalid appointment type'),
    body('status').optional().isIn(['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('created_by').optional().isUUID().withMessage('Created by must be a valid UUID'),
    validateRequest
  ],
  authenticate,
  appointmentController.createAppointment
);

// Update appointment
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid appointment ID'),
    body('doctor_id').optional().isUUID().withMessage('Doctor ID must be a valid UUID'),
    body('patient_id').optional().isUUID().withMessage('Patient ID must be a valid UUID'),
    body('start_time').optional().isISO8601().withMessage('Start time must be a valid ISO 8601 date'),
    body('end_time').optional().isISO8601().withMessage('End time must be a valid ISO 8601 date'),
    body('appointment_type').optional().isIn(['in_person', 'telemedicine', 'follow_up', 'urgent', 'routine']).withMessage('Invalid appointment type'),
    body('status').optional().isIn(['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    validateRequest
  ],
  authenticate,
  appointmentController.updateAppointment
);

// Delete appointment
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid appointment ID'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['doctor', 'admin']),
  appointmentController.deleteAppointment
);

// Update appointment status
router.patch(
  '/:id/status',
  [
    param('id').isUUID().withMessage('Invalid appointment ID'),
    body('status').isIn(['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status'),
    validateRequest
  ],
  authenticate,
  appointmentController.updateAppointmentStatus
);

module.exports = router;
