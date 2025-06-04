const logger = require('../utils/logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message, 403);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

class InternalServerError extends AppError {
  constructor(message) {
    super(message, 500);
  }
}

// Handle different types of errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ValidationError(message);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new ValidationError(message);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ValidationError(message);
};

const handleJWTError = () =>
  new UnauthorizedError('Invalid token. Please log in again!');

const handleJWTExpiredError = () =>
  new UnauthorizedError('Your token has expired! Please log in again.');

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR:', err);

    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = {
  errorHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError
};
