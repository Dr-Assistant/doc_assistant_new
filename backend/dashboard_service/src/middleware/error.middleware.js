/**
 * Error Handling Middleware
 * This middleware handles errors and sends appropriate responses
 */

const { StatusCodes } = require('http-status-codes');
const { logger } = require('../utils/logger');
const { APIError, IntegrationError } = require('../utils/errors');

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
    // Special handling for integration errors
    if (err instanceof IntegrationError) {
      return res.status(err.statusCode).json({
        success: false,
        error: {
          message: err.message,
          service: err.service
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

  // Handle Axios errors
  if (err.isAxiosError) {
    const statusCode = err.response ? err.response.status : StatusCodes.BAD_GATEWAY;
    const message = err.response && err.response.data && err.response.data.error 
      ? err.response.data.error.message 
      : 'Error communicating with external service';
    
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        service: err.config ? err.config.url : null
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
