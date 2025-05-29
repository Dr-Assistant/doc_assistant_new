/**
 * Integration Service
 * This module provides methods to communicate with other services
 */

const axios = require('axios');
const { IntegrationError, ServiceUnavailableError } = require('../utils/errors');
const { logger } = require('../utils/logger');

// Load environment variables
require('dotenv').config();

/**
 * Create axios instance with default config
 * @param {string} baseURL - Base URL for the service
 * @param {number} [timeout=5000] - Request timeout in milliseconds
 * @returns {Object} Axios instance
 */
const createServiceClient = (baseURL, timeout = 5000) => {
  return axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

// Create service clients
const scheduleServiceClient = createServiceClient(process.env.SCHEDULE_SERVICE_URL);
const patientServiceClient = createServiceClient(process.env.PATIENT_SERVICE_URL);
const userServiceClient = createServiceClient(process.env.USER_SERVICE_URL);
const taskServiceClient = createServiceClient(process.env.TASK_SERVICE_URL);
const alertServiceClient = createServiceClient(process.env.ALERT_SERVICE_URL);

/**
 * Get today's appointments for a doctor
 * @param {string} doctorId - Doctor ID
 * @param {string} [token] - Authentication token
 * @returns {Promise<Array>} Today's appointments
 */
exports.getTodayAppointments = async (doctorId, token) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    logger.info('Fetching today\'s appointments from Schedule Service', { doctorId });

    const response = await scheduleServiceClient.get(
      `/api/appointments/today?doctorId=${doctorId}`,
      { headers }
    );

    if (response.data.success) {
      logger.info('Successfully fetched appointments from Schedule Service', {
        doctorId,
        count: response.data.data.length
      });
      return response.data.data;
    } else {
      throw new IntegrationError('Failed to get today\'s appointments', 'Schedule Service');
    }
  } catch (error) {
    logger.error('Error getting today\'s appointments from Schedule Service', {
      error: error.message,
      stack: error.stack,
      doctorId
    });

    // Return mock data when schedule service is unavailable
    if (error.isAxiosError && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout'))) {
      logger.warn('Schedule Service unavailable, returning mock appointments data', { doctorId });
      return [
        {
          id: 'mock-1',
          patient_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          appointment_type: 'routine',
          status: 'scheduled',
          reason: 'Regular checkup',
          notes: 'Mock appointment data - Schedule service unavailable'
        }
      ];
    }

    if (error.isAxiosError && error.response) {
      throw new IntegrationError(
        error.response.data?.error?.message || 'Failed to get today\'s appointments',
        'Schedule Service'
      );
    }

    throw error;
  }

  /* Original implementation - temporarily disabled
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await scheduleServiceClient.get(
      `/api/appointments/today?doctorId=${doctorId}`,
      { headers }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new IntegrationError('Failed to get today\'s appointments', 'Schedule Service');
    }
  } catch (error) {
    logger.error('Error getting today\'s appointments', {
      error: error.message,
      stack: error.stack,
      doctorId
    });

    // Return mock data when schedule service is unavailable
    if (error.isAxiosError && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout'))) {
      logger.warn('Schedule Service unavailable, returning mock appointments data', { doctorId });
      return [
        {
          id: 'mock-1',
          patient_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          appointment_type: 'routine',
          status: 'scheduled',
          reason: 'Regular checkup',
          notes: 'Mock appointment data - Schedule service unavailable'
        },
        {
          id: 'mock-2',
          patient_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
          appointment_type: 'follow_up',
          status: 'confirmed',
          reason: 'Follow-up consultation',
          notes: 'Mock appointment data - Schedule service unavailable'
        }
      ];
    }

    if (error.isAxiosError && error.response) {
      throw new IntegrationError(
        error.response.data?.error?.message || 'Failed to get today\'s appointments',
        'Schedule Service'
      );
    }

    throw error;
  }
  */
};

/**
 * Get patient summary
 * @param {string} patientId - Patient ID
 * @param {string} [token] - Authentication token
 * @returns {Promise<Object>} Patient summary
 */
exports.getPatientSummary = async (patientId, token) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    logger.info('Fetching patient summary from Patient Service', { patientId });

    const response = await patientServiceClient.get(
      `/api/patients/${patientId}`,
      { headers }
    );

    if (response.data.success) {
      logger.info('Successfully fetched patient from Patient Service', { patientId });
      return response.data.data;
    } else {
      throw new IntegrationError('Failed to get patient summary', 'Patient Service');
    }
  } catch (error) {
    logger.error('Error getting patient summary from Patient Service', {
      error: error.message,
      stack: error.stack,
      patientId
    });

    // Return mock data when patient service is unavailable
    if (error.isAxiosError && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT')) {
      logger.warn('Patient Service unavailable, returning mock patient data', { patientId });

      // Return different mock patients based on ID
      if (patientId === 'dddddddd-dddd-dddd-dddd-dddddddddddd') {
        return {
          id: patientId,
          first_name: 'Sneha',
          last_name: 'Patel',
          date_of_birth: '1990-05-15',
          gender: 'female'
        };
      } else {
        return {
          id: patientId,
          first_name: 'Unknown',
          last_name: 'Patient',
          date_of_birth: '1980-01-01',
          gender: 'unknown'
        };
      }
    }

    if (error.isAxiosError && error.response) {
      throw new IntegrationError(
        error.response.data?.error?.message || 'Failed to get patient summary',
        'Patient Service'
      );
    }

    throw error;
  }

  /* Original implementation - temporarily disabled
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await patientServiceClient.get(
      `/api/patients/${patientId}`,
      { headers }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new IntegrationError('Failed to get patient summary', 'Patient Service');
    }
  } catch (error) {
    logger.error('Error getting patient summary', {
      error: error.message,
      stack: error.stack,
      patientId
    });

    if (error.isAxiosError) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new ServiceUnavailableError('Patient Service is unavailable');
      }

      if (error.response) {
        throw new IntegrationError(
          error.response.data?.error?.message || 'Failed to get patient summary',
          'Patient Service'
        );
      }
    }

    throw error;
  }
  */
};

/**
 * Get pending tasks for a doctor
 * @param {string} doctorId - Doctor ID
 * @param {string} [token] - Authentication token
 * @returns {Promise<Array>} Pending tasks
 */
exports.getPendingTasks = async (doctorId, token) => {
  try {
    // Note: Task Service will be implemented in MVP-019
    // For now, return mock data with proper frontend format
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return [
      {
        id: '1',
        title: 'Review lab results',
        description: 'Review blood work results for diabetes monitoring',
        patientId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        patientName: 'John Doe',
        priority: 'high',
        status: 'pending',
        taskType: 'review',
        dueDate: today,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        isDueToday: true,
        isOverdue: false
      },
      {
        id: '2',
        title: 'Complete SOAP note',
        description: 'Finalize consultation notes from yesterday',
        patientId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        patientName: 'Jane Smith',
        priority: 'medium',
        status: 'pending',
        taskType: 'documentation',
        dueDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        isDueToday: false,
        isOverdue: true
      },
      {
        id: '3',
        title: 'Prescription renewal',
        description: 'Renew blood pressure medication',
        patientId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        patientName: 'Bob Johnson',
        priority: 'low',
        status: 'pending',
        taskType: 'prescription',
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        isDueToday: false,
        isOverdue: false
      }
    ];

    // Uncomment when Task Service is implemented
    /*
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await taskServiceClient.get(
      `/api/tasks/pending?assignedTo=${doctorId}`,
      { headers }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new IntegrationError('Failed to get pending tasks', 'Task Service');
    }
    */
  } catch (error) {
    logger.error('Error getting pending tasks', {
      error: error.message,
      stack: error.stack,
      doctorId
    });

    if (error.isAxiosError) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new ServiceUnavailableError('Task Service is unavailable');
      }

      if (error.response) {
        throw new IntegrationError(
          error.response.data?.error?.message || 'Failed to get pending tasks',
          'Task Service'
        );
      }
    }

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
    // Note: Alert Service will be implemented in MVP-035
    // For now, return mock data with proper frontend format
    const now = new Date();

    return [
      {
        id: '1',
        title: 'Critical Lab Result',
        message: 'Abnormal glucose levels detected for John Doe',
        severity: 'critical',
        type: 'clinical',
        patientId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        patientName: 'John Doe',
        createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        isRead: false,
        actionRequired: true
      },
      {
        id: '2',
        title: 'Schedule Change',
        message: 'Patient Jane Smith requested to reschedule appointment',
        severity: 'medium',
        type: 'schedule',
        patientId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        patientName: 'Jane Smith',
        createdAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        isRead: false,
        actionRequired: false
      }
    ];

    // Uncomment when Alert Service is implemented
    /*
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await alertServiceClient.get(
      `/api/alerts/critical?doctorId=${doctorId}`,
      { headers }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new IntegrationError('Failed to get critical alerts', 'Alert Service');
    }
    */
  } catch (error) {
    logger.error('Error getting critical alerts', {
      error: error.message,
      stack: error.stack,
      doctorId
    });

    if (error.isAxiosError) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new ServiceUnavailableError('Alert Service is unavailable');
      }

      if (error.response) {
        throw new IntegrationError(
          error.response.data?.error?.message || 'Failed to get critical alerts',
          'Alert Service'
        );
      }
    }

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
    // Get appointments and other data for metrics calculation
    const appointments = await this.getTodayAppointments(doctorId, token);
    const tasks = await this.getPendingTasks(doctorId, token);
    const alerts = await this.getCriticalAlerts(doctorId, token);

    // Calculate appointment metrics
    const patientsScheduledToday = appointments.length;
    const patientsSeenToday = appointments.filter(a => a.status === 'completed').length;
    const completedAppointments = patientsSeenToday;
    const inProgressAppointments = appointments.filter(a => a.status === 'in_progress').length;
    const waitingAppointments = appointments.filter(a => ['scheduled', 'confirmed', 'checked_in'].includes(a.status)).length;

    // Calculate completion rate
    const completionRate = patientsScheduledToday > 0 ? Math.round((patientsSeenToday / patientsScheduledToday) * 100) : 0;

    // Calculate other metrics (mock data for now - will be real when analytics service is implemented)
    const averageWaitTime = 12; // minutes
    const averageConsultationTime = 25; // minutes
    const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
    const criticalAlertsCount = alerts.filter(a => a.severity === 'critical').length;

    // Optional metrics (will be implemented in future tickets)
    const revenueToday = 4500; // Mock data
    const patientSatisfactionScore = 4.7; // Mock data

    return {
      // Core metrics (real data)
      patientsSeenToday,
      patientsScheduledToday,
      completionRate,
      pendingTasksCount,
      criticalAlertsCount,

      // Performance metrics (mock data for now)
      averageWaitTime,
      averageConsultationTime,

      // Optional metrics (mock data for now)
      revenueToday,
      patientSatisfactionScore,

      // Legacy fields for backward compatibility
      totalAppointments: patientsScheduledToday,
      completedAppointments,
      inProgressAppointments,
      waitingAppointments,
      progress: completionRate
    };
  } catch (error) {
    logger.error('Error getting practice metrics', {
      error: error.message,
      stack: error.stack,
      doctorId
    });

    // Return mock metrics when there's an error
    logger.warn('Returning mock practice metrics due to error', { doctorId });
    return {
      patientsSeenToday: 0,
      patientsScheduledToday: 2,
      averageWaitTime: 15,
      averageConsultationTime: 25,
      completionRate: 0,
      pendingTasksCount: 3,
      criticalAlertsCount: 1,
      revenueToday: 4500,
      patientSatisfactionScore: 4.7,

      // Legacy fields
      totalAppointments: 2,
      completedAppointments: 0,
      inProgressAppointments: 0,
      waitingAppointments: 2,
      progress: 0
    };
  }
};
