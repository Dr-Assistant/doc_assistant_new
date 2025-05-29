/**
 * Appointment Repository
 * This module provides data access methods for the Appointment model
 */

const { Op } = require('sequelize');
const { Appointment } = require('../models');
const { logger } = require('../utils/logger');
const moment = require('moment');

/**
 * Find all appointments with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Appointments with pagination metadata
 */
exports.findAll = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    doctorId = null,
    patientId = null,
    status = null,
    type = null,
    startDate = null,
    endDate = null,
    sort = 'start_time',
    order = 'ASC'
  } = options;

  // Build where clause
  const where = {};

  if (doctorId) {
    where.doctor_id = doctorId;
  }

  if (patientId) {
    where.patient_id = patientId;
  }

  if (status) {
    where.status = status;
  }

  if (type) {
    where.appointment_type = type;
  }

  // Date range filtering
  if (startDate && endDate) {
    where.start_time = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  } else if (startDate) {
    where.start_time = {
      [Op.gte]: new Date(startDate)
    };
  } else if (endDate) {
    where.start_time = {
      [Op.lte]: new Date(endDate)
    };
  }

  // Calculate pagination
  const offset = (page - 1) * limit;

  try {
    // Get appointments
    const { count, rows } = await Appointment.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sort, order]]
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      appointments: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev
      }
    };
  } catch (error) {
    logger.error('Error finding appointments', {
      error: error.message,
      stack: error.stack,
      options
    });
    throw error;
  }
};

/**
 * Find appointments by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Appointments
 */
exports.findByDateRange = async (startDate, endDate, options = {}) => {
  const { doctorId = null, patientId = null, status = null } = options;

  // Convert dates and handle timezone properly
  const start = new Date(startDate);
  let end = new Date(endDate);

  // If endDate is the same as startDate (day view), extend to end of day
  if (startDate === endDate) {
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  // Build where clause
  const where = {
    start_time: {
      [Op.between]: [start, end]
    }
  };

  if (doctorId) {
    where.doctor_id = doctorId;
  }

  if (patientId) {
    where.patient_id = patientId;
  }

  if (status) {
    where.status = status;
  }

  try {
    return await Appointment.findAll({
      where,
      order: [['start_time', 'ASC']]
    });
  } catch (error) {
    logger.error('Error finding appointments by date range', {
      error: error.message,
      stack: error.stack,
      startDate,
      endDate,
      options
    });
    throw error;
  }
};

/**
 * Find appointments for today
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Today's appointments
 */
exports.findToday = async (options = {}) => {
  const { doctorId = null, patientId = null, status = null } = options;

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  return this.findByDateRange(startOfDay, endOfDay, options);
};

/**
 * Find a appointment by ID
 * @param {string} id - Appointment ID
 * @returns {Promise<Object>} Appointment
 */
exports.findById = async (id) => {
  try {
    return await Appointment.findByPk(id);
  } catch (error) {
    logger.error('Error finding appointment by ID', {
      error: error.message,
      stack: error.stack,
      id
    });
    throw error;
  }
};

/**
 * Check for appointment conflicts
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @param {string} doctorId - Doctor ID
 * @param {string} [excludeId] - Appointment ID to exclude (for updates)
 * @returns {Promise<Array>} Conflicting appointments
 */
exports.checkConflicts = async (startTime, endTime, doctorId, excludeId = null) => {
  try {
    const where = {
      doctor_id: doctorId,
      [Op.or]: [
        // Case 1: New appointment starts during an existing appointment
        {
          start_time: { [Op.lte]: new Date(startTime) },
          end_time: { [Op.gt]: new Date(startTime) }
        },
        // Case 2: New appointment ends during an existing appointment
        {
          start_time: { [Op.lt]: new Date(endTime) },
          end_time: { [Op.gte]: new Date(endTime) }
        },
        // Case 3: New appointment completely contains an existing appointment
        {
          start_time: { [Op.gte]: new Date(startTime) },
          end_time: { [Op.lte]: new Date(endTime) }
        }
      ],
      status: {
        [Op.notIn]: ['cancelled', 'no_show', 'completed']
      }
    };

    // Exclude the current appointment if updating
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    return await Appointment.findAll({ where });
  } catch (error) {
    logger.error('Error checking appointment conflicts', {
      error: error.message,
      stack: error.stack,
      startTime,
      endTime,
      doctorId,
      excludeId
    });
    throw error;
  }
};

/**
 * Create a new appointment
 * @param {Object} appointmentData - Appointment data
 * @returns {Promise<Object>} Created appointment
 */
exports.create = async (appointmentData) => {
  try {
    return await Appointment.create(appointmentData);
  } catch (error) {
    logger.error('Error creating appointment', {
      error: error.message,
      stack: error.stack,
      appointmentData
    });
    throw error;
  }
};

/**
 * Update an appointment
 * @param {string} id - Appointment ID
 * @param {Object} appointmentData - Appointment data
 * @returns {Promise<Object>} Updated appointment
 */
exports.update = async (id, appointmentData) => {
  try {
    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return null;
    }

    await appointment.update(appointmentData);

    return appointment;
  } catch (error) {
    logger.error('Error updating appointment', {
      error: error.message,
      stack: error.stack,
      id,
      appointmentData
    });
    throw error;
  }
};

/**
 * Delete an appointment
 * @param {string} id - Appointment ID
 * @returns {Promise<boolean>} Success flag
 */
exports.delete = async (id) => {
  try {
    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return false;
    }

    await appointment.destroy();

    return true;
  } catch (error) {
    logger.error('Error deleting appointment', {
      error: error.message,
      stack: error.stack,
      id
    });
    throw error;
  }
};
