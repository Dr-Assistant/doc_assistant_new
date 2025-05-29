/**
 * Authentication Middleware
 * Verifies JWT tokens from the Auth Service
 */

const axios = require('axios');
const { logger } = require('../utils/logger');
const config = require('../config');
const { UnauthorizedError } = require('./error.middleware');

/**
 * Middleware to verify authentication token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }
    
    // Verify token with Auth Service
    const response = await axios.post(
      `${config.authService.url}/api/auth/verify-token`,
      { token },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!response.data.valid) {
      throw new UnauthorizedError('Invalid token');
    }
    
    // Add user data to request
    req.user = response.data.user;
    
    next();
  } catch (error) {
    if (error.response?.status === 401) {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
    
    logger.error('Error verifying token:', error);
    next(error);
  }
};

module.exports = {
  verifyToken
};
