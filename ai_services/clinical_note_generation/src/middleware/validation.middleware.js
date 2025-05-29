const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/error-handler');

/**
 * Validation middleware to check express-validator results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    const error = new ValidationError('Validation failed');
    error.details = errorMessages;
    
    return next(error);
  }
  
  next();
};

module.exports = {
  validate
};
