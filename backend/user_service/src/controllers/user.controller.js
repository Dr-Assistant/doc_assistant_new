/**
 * User Controller
 * This module provides controller functions for user routes
 */

const { StatusCodes } = require('http-status-codes');
const userService = require('../services/user.service');
const { logger } = require('../utils/logger');

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, role, status, search, sort, order } = req.query;

    const result = await userService.getAllUsers({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      role,
      status,
      search,
      sort: sort || 'full_name',
      order: order || 'ASC'
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { message: 'User deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updateCurrentUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.user.id, req.body);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updateUserPreferences = async (req, res, next) => {
  try {
    const user = await userService.updateUserPreferences(req.user.id, req.body);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { preferences: user.preferences }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getUserPreferences = async (req, res, next) => {
  try {
    const preferences = await userService.getUserPreferences(req.user.id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { preferences }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create user (internal service-to-service endpoint)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.createUserInternal = async (req, res, next) => {
  try {
    const user = await userService.createUserInternal(req.body);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
