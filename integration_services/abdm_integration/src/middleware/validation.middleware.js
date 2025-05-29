/**
 * Validation Middleware
 * Validates request data using express-validator
 */

const { validationResult } = require('express-validator');
const { BadRequestError } = require('./error.middleware');

/**
 * Middleware to validate request data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));
    
    throw new BadRequestError('Validation error', errorMessages);
  }
  
  next();
};

module.exports = {
  validate
};
