/**
 * Doctor Availability Routes
 * This module defines the routes for doctor availability operations
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const availabilityController = require('../controllers/availability.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all availabilities for a doctor
router.get(
  '/doctor/:doctorId',
  [
    param('doctorId').isUUID().withMessage('Doctor ID must be a valid UUID'),
    query('isAvailable').optional().isBoolean().withMessage('Is available must be a boolean'),
    query('dayOfWeek').optional().isInt({ min: 0, max: 6 }).withMessage('Day of week must be between 0 and 6'),
    query('sort').optional().isIn(['day_of_week', 'start_time', 'end_time', 'created_at']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['ASC', 'DESC']).withMessage('Order must be ASC or DESC'),
    validateRequest
  ],
  authenticate,
  availabilityController.getDoctorAvailabilities
);

// Get availability by ID
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid availability ID'),
    validateRequest
  ],
  authenticate,
  availabilityController.getAvailabilityById
);

// Get available time slots for a doctor on a specific date
router.get(
  '/doctor/:doctorId/time-slots',
  [
    param('doctorId').isUUID().withMessage('Doctor ID must be a valid UUID'),
    query('date').isISO8601().withMessage('Date is required and must be a valid ISO 8601 date'),
    query('duration').optional().isInt({ min: 5 }).withMessage('Duration must be a positive integer'),
    validateRequest
  ],
  authenticate,
  availabilityController.getAvailableTimeSlots
);

// Create a new availability
router.post(
  '/',
  [
    body('doctor_id').isUUID().withMessage('Doctor ID is required and must be a valid UUID'),
    body('day_of_week').isInt({ min: 0, max: 6 }).withMessage('Day of week must be between 0 and 6'),
    body('start_time').matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/).withMessage('Start time must be in HH:MM:SS format'),
    body('end_time').matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/).withMessage('End time must be in HH:MM:SS format'),
    body('is_available').optional().isBoolean().withMessage('Is available must be a boolean'),
    body('recurrence_type').optional().isIn(['weekly', 'biweekly', 'monthly', 'custom']).withMessage('Invalid recurrence type'),
    body('recurrence_end_date').optional().isISO8601().withMessage('Recurrence end date must be a valid ISO 8601 date'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['doctor', 'admin']),
  availabilityController.createAvailability
);

// Update availability
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid availability ID'),
    body('doctor_id').optional().isUUID().withMessage('Doctor ID must be a valid UUID'),
    body('day_of_week').optional().isInt({ min: 0, max: 6 }).withMessage('Day of week must be between 0 and 6'),
    body('start_time').optional().matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/).withMessage('Start time must be in HH:MM:SS format'),
    body('end_time').optional().matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/).withMessage('End time must be in HH:MM:SS format'),
    body('is_available').optional().isBoolean().withMessage('Is available must be a boolean'),
    body('recurrence_type').optional().isIn(['weekly', 'biweekly', 'monthly', 'custom']).withMessage('Invalid recurrence type'),
    body('recurrence_end_date').optional().isISO8601().withMessage('Recurrence end date must be a valid ISO 8601 date'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['doctor', 'admin']),
  availabilityController.updateAvailability
);

// Delete availability
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid availability ID'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['doctor', 'admin']),
  availabilityController.deleteAvailability
);

module.exports = router;
