const { validationResult } = require('express-validator');
const { logger } = require('../utils/logger');

/**
 * Validation middleware to handle express-validator results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    logger.warn('Validation failed', {
      url: req.originalUrl,
      method: req.method,
      errors: errorMessages,
      body: req.body,
      params: req.params,
      query: req.query
    });

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errorMessages
      }
    });
  }

  next();
};

module.exports = {
  validate
};
