/**
 * Dashboard Service
 * This module provides business logic for dashboard operations
 */

const integrationService = require('./integration.service');
const cacheService = require('./cache.service');
const { logger } = require('../utils/logger');
const moment = require('moment');

// Load environment variables
require('dotenv').config();

// Cache TTL in seconds
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10);

/**
 * Get today's appointments for a doctor
 * @param {string} doctorId - Doctor ID
 * @param {string} [token] - Authentication token
 * @returns {Promise<Array>} Today's appointments
 */
exports.getTodayAppointments = async (doctorId, token) => {
  try {
    // Try to get from cache
    const cacheKey = `dashboard:appointments:today:${doctorId}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      logger.debug('Retrieved today\'s appointments from cache', { doctorId });
      return cachedData;
    }

    // Get appointments from Schedule Service
    const appointments = await integrationService.getTodayAppointments(doctorId, token);

    // Enrich appointments with patient data and transform to frontend format
    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          const patient = await integrationService.getPatientSummary(appointment.patient_id, token);

          // Transform to frontend format
          return transformAppointmentForFrontend(appointment, patient);
        } catch (error) {
          logger.error('Error enriching appointment with patient data', {
            error: error.message,
            appointmentId: appointment.id
          });

          // Transform with unknown patient data
          return transformAppointmentForFrontend(appointment, {
            id: appointment.patient_id,
            first_name: 'Unknown',
            last_name: 'Patient',
            date_of_birth: '1980-01-01',
            gender: 'unknown'
          });
        }
      })
    );

    // Sort appointments by time (already sorted by start_time, but using time field for consistency)
    const sortedAppointments = enrichedAppointments.sort((a, b) => {
      return a.time.localeCompare(b.time);
    });

    // Cache the result
    await cacheService.set(cacheKey, sortedAppointments, CACHE_TTL);

    return sortedAppointments;
  } catch (error) {
    logger.error('Error getting today\'s appointments', {
      error: error.message,
      stack: error.stack,
      doctorId
    });
    throw error;
  }
};

/**
 * Get pending tasks for a doctor
 * @param {string} doctorId - Doctor ID
 * @param {string} [token] - Authentication token
 * @returns {Promise<Array>} Pending tasks
 */
exports.getPendingTasks = async (doctorId, token) => {
  try {
    // Try to get from cache
    const cacheKey = `dashboard:tasks:pending:${doctorId}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      logger.debug('Retrieved pending tasks from cache', { doctorId });
      return cachedData;
    }

    // Get tasks from Task Service
    const tasks = await integrationService.getPendingTasks(doctorId, token);

    // Sort tasks by priority
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    const sortedTasks = tasks.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Cache the result
    await cacheService.set(cacheKey, sortedTasks, CACHE_TTL);

    return sortedTasks;
  } catch (error) {
    logger.error('Error getting pending tasks', {
      error: error.message,
      stack: error.stack,
      doctorId
    });
    throw error;
  }
};

/**
 * Get critical alerts for a doctor
 * @param {string} doctorId - Doctor ID
 * @param {string} [token] - Authentication token
 * @returns {Promise<Array>} Critical alerts
 */
exports.getCriticalAlerts = async (doctorId, token) => {
  try {
    // Try to get from cache
    const cacheKey = `dashboard:alerts:critical:${doctorId}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      logger.debug('Retrieved critical alerts from cache', { doctorId });
      return cachedData;
    }

    // Get alerts from Alert Service
    const alerts = await integrationService.getCriticalAlerts(doctorId, token);

    // Sort alerts by severity
    const severityOrder = { critical: 1, warning: 2, info: 3 };
    const sortedAlerts = alerts.sort((a, b) => {
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    // Cache the result
    await cacheService.set(cacheKey, sortedAlerts, CACHE_TTL);

    return sortedAlerts;
  } catch (error) {
    logger.error('Error getting critical alerts', {
      error: error.message,
      stack: error.stack,
      doctorId
    });
    throw error;
  }
};

/**
 * Get practice metrics for a doctor
 * @param {string} doctorId - Doctor ID
 * @param {string} [token] - Authentication token
 * @returns {Promise<Object>} Practice metrics
 */
exports.getPracticeMetrics = async (doctorId, token) => {
  try {
    // Try to get from cache
    const cacheKey = `dashboard:metrics:practice:${doctorId}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      logger.debug('Retrieved practice metrics from cache', { doctorId });
      return cachedData;
    }

    // Get metrics from Integration Service
    const metrics = await integrationService.getPracticeMetrics(doctorId, token);

    // Cache the result
    await cacheService.set(cacheKey, metrics, CACHE_TTL);

    return metrics;
  } catch (error) {
    logger.error('Error getting practice metrics', {
      error: error.message,
      stack: error.stack,
      doctorId
    });
    throw error;
  }
};

/**
 * Get complete dashboard data for a doctor
 * @param {string} doctorId - Doctor ID
 * @param {string} [token] - Authentication token
 * @returns {Promise<Object>} Dashboard data
 */
exports.getDashboardData = async (doctorId, token) => {
  try {
    // Try to get from cache
    const cacheKey = `dashboard:complete:${doctorId}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      logger.debug('Retrieved complete dashboard data from cache', { doctorId });
      return cachedData;
    }

    // Get all dashboard data in parallel
    const [appointments, tasks, alerts, metrics] = await Promise.all([
      this.getTodayAppointments(doctorId, token),
      this.getPendingTasks(doctorId, token),
      this.getCriticalAlerts(doctorId, token),
      this.getPracticeMetrics(doctorId, token)
    ]);

    const dashboardData = {
      appointments,
      tasks,
      alerts,
      metrics,
      timestamp: new Date()
    };

    // Cache the result
    await cacheService.set(cacheKey, dashboardData, CACHE_TTL);

    return dashboardData;
  } catch (error) {
    logger.error('Error getting complete dashboard data', {
      error: error.message,
      stack: error.stack,
      doctorId
    });
    throw error;
  }
};

/**
 * Calculate age from date of birth
 * @param {string} dateOfBirth - Date of birth
 * @returns {number} Age in years
 */
function calculateAge(dateOfBirth) {
  return moment().diff(moment(dateOfBirth), 'years');
}

/**
 * Transform appointment data from backend format to frontend format
 * @param {Object} appointment - Backend appointment data
 * @param {Object} patient - Patient data
 * @returns {Object} Frontend-formatted appointment
 */
function transformAppointmentForFrontend(appointment, patient) {
  const startTime = moment(appointment.start_time);
  const endTime = moment(appointment.end_time);
  const duration = endTime.diff(startTime, 'minutes');

  return {
    id: appointment.id,
    time: startTime.format('HH:mm'),
    duration: duration,
    patientName: `${patient.first_name} ${patient.last_name}`,
    patientAge: patient.getAge ? patient.getAge() : calculateAge(patient.date_of_birth),
    type: appointment.appointment_type.replace('_', ' '),
    status: appointment.status,
    notes: appointment.notes || appointment.reason,
    isUrgent: appointment.appointment_type === 'urgent',

    // Keep original data for backend compatibility
    ...appointment,
    patient: {
      id: patient.id,
      name: `${patient.first_name} ${patient.last_name}`,
      age: patient.getAge ? patient.getAge() : calculateAge(patient.date_of_birth),
      gender: patient.gender
    }
  };
}
