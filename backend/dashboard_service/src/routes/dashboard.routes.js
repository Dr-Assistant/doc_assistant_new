/**
 * Dashboard Routes
 * This module defines the routes for dashboard operations
 */

const express = require('express');
const { query } = require('express-validator');
const dashboardController = require('../controllers/dashboard.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Get today's appointments
router.get(
  '/appointments/today',
  [
    query('doctorId').optional().isUUID().withMessage('Doctor ID must be a valid UUID'),
    validateRequest
  ],
  authenticate,
  dashboardController.getTodayAppointments
);

// Get pending tasks
router.get(
  '/tasks/pending',
  [
    query('doctorId').optional().isUUID().withMessage('Doctor ID must be a valid UUID'),
    validateRequest
  ],
  authenticate,
  dashboardController.getPendingTasks
);

// Get critical alerts
router.get(
  '/alerts/critical',
  [
    query('doctorId').optional().isUUID().withMessage('Doctor ID must be a valid UUID'),
    validateRequest
  ],
  authenticate,
  dashboardController.getCriticalAlerts
);

// Get practice metrics
router.get(
  '/metrics/practice',
  [
    query('doctorId').optional().isUUID().withMessage('Doctor ID must be a valid UUID'),
    validateRequest
  ],
  authenticate,
  dashboardController.getPracticeMetrics
);

// Get complete dashboard data
router.get(
  '/complete',
  [
    query('doctorId').optional().isUUID().withMessage('Doctor ID must be a valid UUID'),
    validateRequest
  ],
  authenticate,
  dashboardController.getDashboardData
);

module.exports = router;
