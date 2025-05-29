/**
 * Appointment Controller
 * This module handles HTTP requests for appointment operations
 */

const { StatusCodes } = require('http-status-codes');
const appointmentService = require('../services/appointment.service');
const cacheService = require('../services/cache.service');
const { logger } = require('../utils/logger');

/**
 * Get all appointments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getAllAppointments = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      patientId,
      status,
      type,
      startDate,
      endDate,
      sort,
      order
    } = req.query;

    // Always filter by the authenticated user's doctor ID for security
    const doctorId = req.user.id;

    // Build cache key with the authenticated doctor ID
    const queryForCache = { page, limit, doctorId, patientId, status, type, startDate, endDate, sort, order };
    const cacheKey = `appointments:${JSON.stringify(queryForCache)}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      logger.info('Returning cached appointment list data', { cacheKey, doctorId });
      return res.status(StatusCodes.OK).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Extract auth token from header
    const authToken = req.headers.authorization?.split(' ')[1];

    const result = await appointmentService.getAllAppointments({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      doctorId,
      patientId,
      status,
      type,
      startDate,
      endDate,
      sort: sort || 'start_time',
      order: order || 'ASC'
    }, authToken);

    // Cache the result
    await cacheService.set(cacheKey, result, 300); // Cache for 5 minutes

    res.status(StatusCodes.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get appointments by date range
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getAppointmentsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { patientId, status } = req.query;

    // Always filter by the authenticated user's doctor ID for security
    const doctorId = req.user.id;

    // Try to get from cache
    const cacheKey = `appointments:range:${startDate}:${endDate}:${doctorId}:${patientId || ''}:${status || ''}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      logger.info('Returning cached appointment data', { cacheKey, appointmentCount: cachedData.length, doctorId });
      return res.status(StatusCodes.OK).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Extract auth token from header
    const authToken = req.headers.authorization?.split(' ')[1];

    const appointments = await appointmentService.getAppointmentsByDateRange(
      startDate,
      endDate,
      { doctorId, patientId, status },
      authToken
    );

    // Cache the result
    await cacheService.set(cacheKey, appointments, 300); // Cache for 5 minutes

    res.status(StatusCodes.OK).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get today's appointments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getTodayAppointments = async (req, res, next) => {
  try {
    const { patientId, status } = req.query;

    // Always filter by the authenticated user's doctor ID for security
    const doctorId = req.user.id;

    // Try to get from cache
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `appointments:today:${today}:${doctorId}:${patientId || ''}:${status || ''}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      logger.info('Returning cached today appointments data', { cacheKey, doctorId });
      return res.status(StatusCodes.OK).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Extract auth token from header
    const authToken = req.headers.authorization?.split(' ')[1];

    const appointments = await appointmentService.getTodayAppointments({
      doctorId,
      patientId,
      status
    }, authToken);

    // Cache the result
    await cacheService.set(cacheKey, appointments, 300); // Cache for 5 minutes
    logger.info('Fetched fresh appointment data and cached', { cacheKey, appointmentCount: appointments.length });

    res.status(StatusCodes.OK).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get appointment by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to get from cache
    const cacheKey = `appointment:${id}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      return res.status(StatusCodes.OK).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const appointment = await appointmentService.getAppointmentById(id);

    // Cache the result
    await cacheService.set(cacheKey, appointment, 300); // Cache for 5 minutes

    res.status(StatusCodes.OK).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new appointment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.createAppointment = async (req, res, next) => {
  try {
    const appointmentData = req.body;

    // Set created_by if not provided
    if (!appointmentData.created_by && req.user) {
      appointmentData.created_by = req.user.id;
    }

    // Extract auth token from header
    const authToken = req.headers.authorization?.split(' ')[1];

    const appointment = await appointmentService.createAppointment(appointmentData, authToken, req.user);

    // Clear relevant caches
    await clearAppointmentCaches(appointment);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update appointment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointmentData = req.body;

    // Extract auth token from header
    const authToken = req.headers.authorization?.split(' ')[1];

    const appointment = await appointmentService.updateAppointment(id, appointmentData, authToken, req.user);

    // Clear relevant caches
    await clearAppointmentCaches(appointment);

    res.status(StatusCodes.OK).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete appointment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get appointment before deletion for cache clearing
    const appointment = await appointmentService.getAppointmentById(id);

    await appointmentService.deleteAppointment(id);

    // Clear relevant caches
    await clearAppointmentCaches(appointment);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { message: 'Appointment deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update appointment status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await appointmentService.updateAppointmentStatus(id, status);

    // Clear relevant caches
    await clearAppointmentCaches(appointment);

    res.status(StatusCodes.OK).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear appointment-related caches
 * @param {Object} appointment - Appointment object
 * @returns {Promise<void>}
 */
async function clearAppointmentCaches(appointment) {
  if (!appointment) return;

  try {
    logger.info('Clearing appointment caches', {
      appointmentId: appointment.id,
      startTime: appointment.start_time,
      doctorId: appointment.doctor_id
    });

    // Clear specific appointment cache
    await cacheService.del(`appointment:${appointment.id}`);
    logger.info('Cleared specific appointment cache', { key: `appointment:${appointment.id}` });

    // Clear date-based caches
    const appointmentDate = new Date(appointment.start_time).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    // Clear today's appointments if the appointment is for today
    if (appointmentDate === today) {
      await cacheService.clearByPattern(`appointments:today:*`);
      logger.info('Cleared today appointments cache');
    }

    // Clear ALL date range caches (this is the most important for schedule view)
    const rangeCleared = await cacheService.clearByPattern(`appointments:range:*`);
    logger.info('Cleared date range caches', { success: rangeCleared });

    // Clear general appointment list caches
    const listCleared = await cacheService.clearByPattern(`appointments:*`);
    logger.info('Cleared general appointment caches', { success: listCleared });

    // Force clear Redis cache completely for this doctor (aggressive approach)
    await cacheService.clearByPattern(`*${appointment.doctor_id}*`);
    logger.info('Cleared all doctor-specific caches', { doctorId: appointment.doctor_id });

    logger.info('Successfully cleared all appointment caches');
  } catch (error) {
    logger.error('Error clearing appointment caches', { error: error.message, stack: error.stack });
  }
}
