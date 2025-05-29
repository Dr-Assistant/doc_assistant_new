/**
 * Doctor Availability Repository
 * This module provides data access methods for the Doctor Availability model
 */

const { Op } = require('sequelize');
const { DoctorAvailability } = require('../models');
const { logger } = require('../utils/logger');

/**
 * Find all availabilities for a doctor
 * @param {string} doctorId - Doctor ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Doctor availabilities
 */
exports.findByDoctor = async (doctorId, options = {}) => {
  const {
    isAvailable = true,
    dayOfWeek = null,
    sort = 'day_of_week',
    order = 'ASC'
  } = options;

  // Build where clause
  const where = {
    doctor_id: doctorId,
    is_available: isAvailable
  };

  if (dayOfWeek !== null) {
    where.day_of_week = dayOfWeek;
  }

  try {
    return await DoctorAvailability.findAll({
      where,
      order: [[sort, order], ['start_time', 'ASC']]
    });
  } catch (error) {
    logger.error('Error finding doctor availabilities', {
      error: error.message,
      stack: error.stack,
      doctorId,
      options
    });
    throw error;
  }
};

/**
 * Find availability by ID
 * @param {string} id - Availability ID
 * @returns {Promise<Object>} Availability
 */
exports.findById = async (id) => {
  try {
    return await DoctorAvailability.findByPk(id);
  } catch (error) {
    logger.error('Error finding availability by ID', {
      error: error.message,
      stack: error.stack,
      id
    });
    throw error;
  }
};

/**
 * Check for availability conflicts
 * @param {Object} availabilityData - Availability data
 * @param {string} [excludeId] - Availability ID to exclude (for updates)
 * @returns {Promise<Array>} Conflicting availabilities
 */
exports.checkConflicts = async (availabilityData, excludeId = null) => {
  const { doctor_id, day_of_week, start_time, end_time } = availabilityData;

  try {
    const where = {
      doctor_id,
      day_of_week,
      [Op.or]: [
        // Case 1: New slot starts during an existing slot
        {
          start_time: { [Op.lte]: start_time },
          end_time: { [Op.gt]: start_time }
        },
        // Case 2: New slot ends during an existing slot
        {
          start_time: { [Op.lt]: end_time },
          end_time: { [Op.gte]: end_time }
        },
        // Case 3: New slot completely contains an existing slot
        {
          start_time: { [Op.gte]: start_time },
          end_time: { [Op.lte]: end_time }
        }
      ]
    };

    // Exclude the current availability if updating
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    return await DoctorAvailability.findAll({ where });
  } catch (error) {
    logger.error('Error checking availability conflicts', {
      error: error.message,
      stack: error.stack,
      availabilityData,
      excludeId
    });
    throw error;
  }
};

/**
 * Create a new availability
 * @param {Object} availabilityData - Availability data
 * @returns {Promise<Object>} Created availability
 */
exports.create = async (availabilityData) => {
  try {
    return await DoctorAvailability.create(availabilityData);
  } catch (error) {
    logger.error('Error creating availability', {
      error: error.message,
      stack: error.stack,
      availabilityData
    });
    throw error;
  }
};

/**
 * Update an availability
 * @param {string} id - Availability ID
 * @param {Object} availabilityData - Availability data
 * @returns {Promise<Object>} Updated availability
 */
exports.update = async (id, availabilityData) => {
  try {
    const availability = await DoctorAvailability.findByPk(id);

    if (!availability) {
      return null;
    }

    await availability.update(availabilityData);

    return availability;
  } catch (error) {
    logger.error('Error updating availability', {
      error: error.message,
      stack: error.stack,
      id,
      availabilityData
    });
    throw error;
  }
};

/**
 * Delete an availability
 * @param {string} id - Availability ID
 * @returns {Promise<boolean>} Success flag
 */
exports.delete = async (id) => {
  try {
    const availability = await DoctorAvailability.findByPk(id);

    if (!availability) {
      return false;
    }

    await availability.destroy();

    return true;
  } catch (error) {
    logger.error('Error deleting availability', {
      error: error.message,
      stack: error.stack,
      id
    });
    throw error;
  }
};

/**
 * Get available time slots for a doctor on a specific date
 * @param {string} doctorId - Doctor ID
 * @param {Date} date - Date to check
 * @param {number} duration - Appointment duration in minutes
 * @returns {Promise<Array>} Available time slots
 */
exports.getAvailableTimeSlots = async (doctorId, date, duration = 30) => {
  try {
    const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 6 = Saturday

    // Get doctor's availability for this day of week
    const availabilities = await this.findByDoctor(doctorId, { dayOfWeek });

    if (!availabilities || availabilities.length === 0) {
      return [];
    }

    // TODO: Implement logic to get available time slots based on existing appointments
    // This would involve:
    // 1. Getting all appointments for the doctor on the specified date
    // 2. Calculating available slots based on the doctor's availability and existing appointments
    // 3. Returning the available slots

    return availabilities;
  } catch (error) {
    logger.error('Error getting available time slots', {
      error: error.message,
      stack: error.stack,
      doctorId,
      date,
      duration
    });
    throw error;
  }
};
