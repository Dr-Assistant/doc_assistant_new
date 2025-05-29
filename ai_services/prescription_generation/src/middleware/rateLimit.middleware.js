const rateLimit = require('express-rate-limit');
const { RateLimitError } = require('../utils/error-handler');

/**
 * Create rate limiter with custom options
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum number of requests per window
 * @param {string} message - Custom error message
 * @returns {Function} Rate limit middleware
 */
const createRateLimit = (windowMs, max, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      statusCode: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      const error = new RateLimitError(message);
      next(error);
    }
  });
};

// Default rate limiter for general API endpoints
const defaultRateLimit = createRateLimit(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  'Too many requests from this IP, please try again later'
);

// Strict rate limiter for AI generation endpoints
const aiGenerationRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 generations per 15 minutes
  'Too many AI generation requests, please try again later'
);

// Rate limiter for authentication endpoints
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // 10 auth requests per 15 minutes
  'Too many authentication attempts, please try again later'
);

module.exports = {
  createRateLimit,
  defaultRateLimit,
  aiGenerationRateLimit,
  authRateLimit
};
