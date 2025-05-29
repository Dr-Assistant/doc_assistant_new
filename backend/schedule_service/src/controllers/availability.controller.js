/**
 * Doctor Availability Controller
 * This module handles HTTP requests for doctor availability operations
 */

const { StatusCodes } = require('http-status-codes');
const availabilityService = require('../services/availability.service');
const cacheService = require('../services/cache.service');
const { logger } = require('../utils/logger');

/**
 * Get all availabilities for a doctor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getDoctorAvailabilities = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { isAvailable, dayOfWeek, sort, order } = req.query;

    // Try to get from cache
    const cacheKey = `availabilities:${doctorId}:${JSON.stringify(req.query)}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      return res.status(StatusCodes.OK).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const availabilities = await availabilityService.getDoctorAvailabilities(doctorId, {
      isAvailable: isAvailable === 'false' ? false : true,
      dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek, 10) : null,
      sort: sort || 'day_of_week',
      order: order || 'ASC'
    });

    // Cache the result
    await cacheService.set(cacheKey, availabilities, 3600); // Cache for 1 hour

    res.status(StatusCodes.OK).json({
      success: true,
      data: availabilities
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get availability by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getAvailabilityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to get from cache
    const cacheKey = `availability:${id}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      return res.status(StatusCodes.OK).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const availability = await availabilityService.getAvailabilityById(id);

    // Cache the result
    await cacheService.set(cacheKey, availability, 3600); // Cache for 1 hour

    res.status(StatusCodes.OK).json({
      success: true,
      data: availability
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new availability
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.createAvailability = async (req, res, next) => {
  try {
    const availabilityData = req.body;

    const availability = await availabilityService.createAvailability(availabilityData, req.user);

    // Clear relevant caches
    await clearAvailabilityCaches(availability);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: availability
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update availability
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const availabilityData = req.body;

    const availability = await availabilityService.updateAvailability(id, availabilityData);

    // Clear relevant caches
    await clearAvailabilityCaches(availability);

    res.status(StatusCodes.OK).json({
      success: true,
      data: availability
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete availability
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.deleteAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get availability before deletion for cache clearing
    const availability = await availabilityService.getAvailabilityById(id);

    await availabilityService.deleteAvailability(id);

    // Clear relevant caches
    await clearAvailabilityCaches(availability);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { message: 'Availability deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available time slots for a doctor on a specific date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getAvailableTimeSlots = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date, duration } = req.query;

    if (!date) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Date is required'
        }
      });
    }

    // Try to get from cache
    const cacheKey = `timeslots:${doctorId}:${date}:${duration || '30'}`;
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      return res.status(StatusCodes.OK).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const timeSlots = await availabilityService.getAvailableTimeSlots(
      doctorId,
      date,
      duration ? parseInt(duration, 10) : 30
    );

    // Cache the result
    await cacheService.set(cacheKey, timeSlots, 300); // Cache for 5 minutes

    res.status(StatusCodes.OK).json({
      success: true,
      data: timeSlots
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear availability-related caches
 * @param {Object} availability - Availability object
 * @returns {Promise<void>}
 */
async function clearAvailabilityCaches(availability) {
  if (!availability) return;

  // Clear specific availability cache
  await cacheService.del(`availability:${availability.id}`);

  // Clear doctor availabilities cache
  await cacheService.clearByPattern(`availabilities:${availability.doctor_id}:*`);

  // Clear time slots cache for the affected day
  await cacheService.clearByPattern(`timeslots:${availability.doctor_id}:*`);
}
