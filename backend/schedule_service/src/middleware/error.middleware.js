/**
 * Error Handling Middleware
 * This middleware handles errors and sends appropriate responses
 */

const { StatusCodes } = require('http-status-codes');
const { logger } = require('../utils/logger');
const { APIError, ScheduleConflictError } = require('../utils/errors');

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Handle API errors
  if (err instanceof APIError) {
    // Special handling for schedule conflicts
    if (err instanceof ScheduleConflictError) {
      return res.status(err.statusCode).json({
        success: false,
        error: {
          message: err.message,
          conflicts: err.conflicts
        }
      });
    }

    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        ...(err.errors && { errors: err.errors })
      }
    });
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));

    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: {
        message: 'Validation error',
        errors
      }
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: {
        message: 'Invalid token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: {
        message: 'Token expired'
      }
    });
  }

  // Handle other errors
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      message
    }
  });
};
