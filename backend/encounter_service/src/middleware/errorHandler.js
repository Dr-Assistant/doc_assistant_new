/**
 * Error Handler Middleware
 * Centralized error handling for the Encounter Service
 */

const { logger } = require('../utils/logger');

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message = 'External service error', details = null) {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

/**
 * Error handler middleware
 */
const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // Log the error
  logger.logError(error, {
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    const message = 'Invalid resource ID format';
    err = new ValidationError(message, { field: error.path, value: error.value });
  }

  // Mongoose duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const message = `Duplicate value for field: ${field}`;
    err = new ConflictError(message);
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    err = new ValidationError('Validation failed', errors);
  }

  // Sequelize validation error
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    err = new ValidationError('Validation failed', errors);
  }

  // Sequelize unique constraint error
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path || 'unknown';
    const message = `Duplicate value for field: ${field}`;
    err = new ConflictError(message);
  }

  // Sequelize foreign key constraint error
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Referenced resource does not exist';
    err = new ValidationError(message, { constraint: error.index });
  }

  // Sequelize database connection error
  if (error.name === 'SequelizeConnectionError') {
    err = new DatabaseError('Database connection failed');
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    err = new UnauthorizedError('Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    err = new UnauthorizedError('Token expired');
  }

  // Multer errors (file upload)
  if (error.code === 'LIMIT_FILE_SIZE') {
    err = new ValidationError('File too large', { maxSize: error.limit });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    err = new ValidationError('Too many files', { maxCount: error.limit });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    err = new ValidationError('Unexpected file field', { field: error.field });
  }

  // Axios errors (external service calls)
  if (error.isAxiosError) {
    const service = error.config?.baseURL || 'External service';
    const message = error.response?.data?.message || error.message;
    err = new ExternalServiceError(service, message, {
      status: error.response?.status,
      data: error.response?.data
    });
  }

  // Default to AppError if not already one
  if (!err.isOperational) {
    err = new AppError(
      err.message || 'Internal server error',
      err.statusCode || 500,
      err.code || 'INTERNAL_ERROR',
      err.details
    );
  }

  // Send error response
  const response = {
    success: false,
    message: err.message,
    error: {
      code: err.code,
      statusCode: err.statusCode
    }
  };

  // Add details in development mode or for validation errors
  if (process.env.NODE_ENV === 'development' || err.statusCode === 400) {
    if (err.details) {
      response.error.details = err.details;
    }
    if (process.env.NODE_ENV === 'development') {
      response.error.stack = err.stack;
    }
  }

  // Add request ID for tracking
  if (req.id) {
    response.error.requestId = req.id;
  }

  res.status(err.statusCode || 500).json(response);
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  
  logger.logSecurityEvent('route_not_found', req.user?.id, req.ip, {
    url: req.originalUrl,
    method: req.method
  });

  res.status(404).json({
    success: false,
    message: error.message,
    error: {
      code: error.code,
      statusCode: error.statusCode,
      path: req.originalUrl,
      method: req.method
    }
  });
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validation error helper
 */
const createValidationError = (message, field = null, value = null) => {
  const details = field ? { field, value } : null;
  return new ValidationError(message, details);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  createValidationError
};
