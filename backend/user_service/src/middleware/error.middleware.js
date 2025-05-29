/**
 * Error Handling Middleware
 * This module provides centralized error handling for the user service
 */

const { StatusCodes } = require('http-status-codes');
const { logger } = require('../utils/logger');
const { 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  ConflictError, 
  BadRequestError 
} = require('../utils/error-handler');

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.errorHandler = (err, req, res, next) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let errors = null;
  
  // Log the error
  logger.error(err.message, { 
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  // Handle specific error types
  if (err instanceof ValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof AuthenticationError) {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = err.message;
  } else if (err instanceof AuthorizationError) {
    statusCode = StatusCodes.FORBIDDEN;
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = StatusCodes.NOT_FOUND;
    message = err.message;
  } else if (err instanceof ConflictError) {
    statusCode = StatusCodes.CONFLICT;
    message = err.message;
  } else if (err instanceof BadRequestError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = err.message;
  } else if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Validation error';
    errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  }
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(errors && { errors })
    }
  });
};
