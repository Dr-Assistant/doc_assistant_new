/**
 * Doctor Availability Service
 * This module provides business logic for doctor availability operations
 */

const availabilityRepository = require('../repositories/availability.repository');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const axios = require('axios');
const moment = require('moment');

/**
 * Get all availabilities for a doctor
 * @param {string} doctorId - Doctor ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Doctor availabilities
 */
exports.getDoctorAvailabilities = async (doctorId, options = {}) => {
  try {
    return await availabilityRepository.findByDoctor(doctorId, options);
  } catch (error) {
    logger.error('Error getting doctor availabilities', {
      error: error.message,
      stack: error.stack,
      doctorId,
      options
    });
    throw error;
  }
};

/**
 * Get availability by ID
 * @param {string} id - Availability ID
 * @returns {Promise<Object>} Availability
 */
exports.getAvailabilityById = async (id) => {
  try {
    const availability = await availabilityRepository.findById(id);

    if (!availability) {
      throw new NotFoundError('Availability not found');
    }

    return availability;
  } catch (error) {
    logger.error('Error getting availability by ID', {
      error: error.message,
      stack: error.stack,
      id
    });
    throw error;
  }
};

/**
 * Create a new availability
 * @param {Object} availabilityData - Availability data
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Created availability
 */
exports.createAvailability = async (availabilityData, currentUser) => {
  try {
    // Validate doctor - check if the doctor ID matches the authenticated user
    // or if the user has admin permissions to create availability for other doctors
    if (availabilityData.doctor_id !== currentUser.id && !['admin'].includes(currentUser.role)) {
      throw new BadRequestError('You can only create availability for yourself');
    }

    // Validate time format
    validateTimeFormat(availabilityData.start_time, availabilityData.end_time);

    // Check for conflicts
    const conflicts = await availabilityRepository.checkConflicts(availabilityData);

    if (conflicts && conflicts.length > 0) {
      throw new ConflictError('Availability conflict detected');
    }

    // Create availability
    return await availabilityRepository.create(availabilityData);
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
 * Update availability
 * @param {string} id - Availability ID
 * @param {Object} availabilityData - Availability data
 * @returns {Promise<Object>} Updated availability
 */
exports.updateAvailability = async (id, availabilityData) => {
  try {
    // Check if availability exists
    const availability = await availabilityRepository.findById(id);

    if (!availability) {
      throw new NotFoundError('Availability not found');
    }

    // If updating doctor, validate it's the same user or admin
    if (availabilityData.doctor_id && availabilityData.doctor_id !== availability.doctor_id) {
      throw new BadRequestError('Cannot change doctor for existing availability');
    }

    // If updating time, validate format
    if (availabilityData.start_time || availabilityData.end_time) {
      validateTimeFormat(
        availabilityData.start_time || availability.start_time,
        availabilityData.end_time || availability.end_time
      );
    }

    // Check for conflicts
    const conflictData = {
      doctor_id: availabilityData.doctor_id || availability.doctor_id,
      day_of_week: availabilityData.day_of_week !== undefined ? availabilityData.day_of_week : availability.day_of_week,
      start_time: availabilityData.start_time || availability.start_time,
      end_time: availabilityData.end_time || availability.end_time
    };

    const conflicts = await availabilityRepository.checkConflicts(conflictData, id);

    if (conflicts && conflicts.length > 0) {
      throw new ConflictError('Availability conflict detected');
    }

    // Update availability
    const updatedAvailability = await availabilityRepository.update(id, availabilityData);

    return updatedAvailability;
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
 * Delete availability
 * @param {string} id - Availability ID
 * @returns {Promise<boolean>} Success flag
 */
exports.deleteAvailability = async (id) => {
  try {
    // Check if availability exists
    const availability = await availabilityRepository.findById(id);

    if (!availability) {
      throw new NotFoundError('Availability not found');
    }

    // Delete availability
    return await availabilityRepository.delete(id);
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
    if (!date) {
      throw new BadRequestError('Date is required');
    }

    return await availabilityRepository.getAvailableTimeSlots(doctorId, date, duration);
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



/**
 * Validate time format
 * @param {string} startTime - Start time
 * @param {string} endTime - End time
 * @returns {void}
 */
function validateTimeFormat(startTime, endTime) {
  // Validate time format (HH:MM:SS)
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;

  if (!timeRegex.test(startTime)) {
    throw new BadRequestError('Invalid start time format. Use HH:MM:SS');
  }

  if (!timeRegex.test(endTime)) {
    throw new BadRequestError('Invalid end time format. Use HH:MM:SS');
  }

  // Validate end time is after start time
  if (startTime >= endTime) {
    throw new BadRequestError('End time must be after start time');
  }
}
