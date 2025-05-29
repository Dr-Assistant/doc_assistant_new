const { logger } = require('./logger');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  /**
   * Create a new API error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Object} data - Additional error data
   */
  constructor(message, statusCode, data = {}) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error
 */
class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed', data = {}) {
    super(message, 401, data);
  }
}

/**
 * Authorization error
 */
class AuthorizationError extends ApiError {
  constructor(message = 'Not authorized to access this resource', data = {}) {
    super(message, 403, data);
  }
}

/**
 * Validation error
 */
class ValidationError extends ApiError {
  constructor(message = 'Validation failed', data = {}) {
    super(message, 400, data);
  }
}

/**
 * Not found error
 */
class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', data = {}) {
    super(message, 404, data);
  }
}

/**
 * Conflict error
 */
class ConflictError extends ApiError {
  constructor(message = 'Resource already exists', data = {}) {
    super(message, 409, data);
  }
}

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ...(err.data && { data: err.data }),
  });

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorData = err.data || {};

  // Handle specific error types
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = 'Validation error';
    errorData = {
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message,
      })),
    };
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(Object.keys(errorData).length > 0 && { details: errorData }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  errorHandler,
};
