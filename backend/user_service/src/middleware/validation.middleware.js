/**
 * Validation Middleware
 * This module provides request validation middleware for the user service
 */

const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/error-handler');

/**
 * Validate request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg
    }));
    
    throw new ValidationError('Validation failed', validationErrors);
  }
  
  next();
};
