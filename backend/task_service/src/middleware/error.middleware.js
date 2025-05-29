/**
 * Error handling middleware
 * Processes errors and returns appropriate responses
 */

const { logger } = require('../utils/logger');

// Custom error classes
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApiError {
  constructor(message, details = null) {
    super(400, message, details);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

class ConflictError extends ApiError {
  constructor(message, details = null) {
    super(409, message, details);
  }
}

class ValidationError extends ApiError {
  constructor(message, details = null) {
    super(422, message, details);
  }
}

// Error handling middleware
const errorMiddleware = (err, req, res, next) => {
  // Log the error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    details: err.details || {},
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Prepare response
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };

  // Send response
  res.status(statusCode).json(errorResponse);
};

module.exports = {
  errorMiddleware,
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError
};
