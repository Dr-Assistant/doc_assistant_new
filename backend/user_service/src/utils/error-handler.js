/**
 * Error Handler Utility
 * This module provides custom error classes for the user service
 */

/**
 * Base custom error class
 */
class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error
 */
class ValidationError extends CustomError {
  constructor(message, errors = []) {
    super(message);
    this.errors = errors;
  }
}

/**
 * Authentication error
 */
class AuthenticationError extends CustomError {
  constructor(message = 'Authentication required') {
    super(message);
  }
}

/**
 * Authorization error
 */
class AuthorizationError extends CustomError {
  constructor(message = 'Insufficient permissions') {
    super(message);
  }
}

/**
 * Not found error
 */
class NotFoundError extends CustomError {
  constructor(message = 'Resource not found') {
    super(message);
  }
}

/**
 * Conflict error
 */
class ConflictError extends CustomError {
  constructor(message = 'Resource already exists') {
    super(message);
  }
}

/**
 * Bad request error
 */
class BadRequestError extends CustomError {
  constructor(message = 'Bad request') {
    super(message);
  }
}

/**
 * Service unavailable error
 */
class ServiceUnavailableError extends CustomError {
  constructor(message = 'Service unavailable') {
    super(message);
  }
}

module.exports = {
  CustomError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
  ServiceUnavailableError
};
