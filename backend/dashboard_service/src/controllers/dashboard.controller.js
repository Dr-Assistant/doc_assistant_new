/**
 * Dashboard Controller
 * This module handles HTTP requests for dashboard operations
 */

const { StatusCodes } = require('http-status-codes');
const dashboardService = require('../services/dashboard.service');
const { logger } = require('../utils/logger');

/**
 * Get today's appointments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getTodayAppointments = async (req, res, next) => {
  try {
    const doctorId = req.query.doctorId || req.user.id;
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

    const appointments = await dashboardService.getTodayAppointments(doctorId, token);

    res.status(StatusCodes.OK).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending tasks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getPendingTasks = async (req, res, next) => {
  try {
    const doctorId = req.query.doctorId || req.user.id;
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

    const tasks = await dashboardService.getPendingTasks(doctorId, token);

    res.status(StatusCodes.OK).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get critical alerts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getCriticalAlerts = async (req, res, next) => {
  try {
    const doctorId = req.query.doctorId || req.user.id;
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

    const alerts = await dashboardService.getCriticalAlerts(doctorId, token);

    res.status(StatusCodes.OK).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get practice metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getPracticeMetrics = async (req, res, next) => {
  try {
    const doctorId = req.query.doctorId || req.user.id;
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

    const metrics = await dashboardService.getPracticeMetrics(doctorId, token);

    res.status(StatusCodes.OK).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get complete dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getDashboardData = async (req, res, next) => {
  try {
    const doctorId = req.query.doctorId || req.user.id;
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

    logger.info('Getting complete dashboard data from real services', { doctorId });

    // Get all dashboard data in parallel from real services
    const [appointments, tasks, alerts, metrics] = await Promise.all([
      dashboardService.getTodayAppointments(doctorId, token),
      dashboardService.getPendingTasks(doctorId, token),
      dashboardService.getCriticalAlerts(doctorId, token),
      dashboardService.getPracticeMetrics(doctorId, token)
    ]);

    const dashboardData = {
      appointments,
      tasks,
      alerts,
      metrics,
      timestamp: new Date()
    };

    logger.info('Complete dashboard data retrieved successfully from real services', {
      doctorId,
      appointmentsCount: appointments.length,
      tasksCount: tasks.length,
      alertsCount: alerts.length
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Error getting complete dashboard data', {
      error: error.message,
      stack: error.stack,
      doctorId: req.user?.id
    });
    next(error);
  }
};
