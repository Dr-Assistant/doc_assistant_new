/**
 * Custom Error Classes
 * This module provides custom error classes for the application
 */

const { StatusCodes } = require('http-status-codes');

/**
 * Base API Error class
 */
class APIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request Error
 */
class BadRequestError extends APIError {
  constructor(message = 'Bad request') {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

/**
 * 401 Unauthorized Error
 */
class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized') {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

/**
 * 403 Forbidden Error
 */
class ForbiddenError extends APIError {
  constructor(message = 'Forbidden') {
    super(message, StatusCodes.FORBIDDEN);
  }
}

/**
 * 404 Not Found Error
 */
class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, StatusCodes.NOT_FOUND);
  }
}

/**
 * 409 Conflict Error
 */
class ConflictError extends APIError {
  constructor(message = 'Resource already exists') {
    super(message, StatusCodes.CONFLICT);
  }
}

/**
 * 422 Unprocessable Entity Error
 */
class ValidationError extends APIError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY);
    this.errors = errors;
  }
}

/**
 * 500 Internal Server Error
 */
class InternalServerError extends APIError {
  constructor(message = 'Internal server error') {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

/**
 * 503 Service Unavailable Error
 */
class ServiceUnavailableError extends APIError {
  constructor(message = 'Service unavailable') {
    super(message, StatusCodes.SERVICE_UNAVAILABLE);
  }
}

/**
 * 409 Schedule Conflict Error
 */
class ScheduleConflictError extends ConflictError {
  constructor(message = 'Schedule conflict detected', conflicts = []) {
    super(message);
    this.conflicts = conflicts;
  }
}

module.exports = {
  APIError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  ServiceUnavailableError,
  ScheduleConflictError
};
