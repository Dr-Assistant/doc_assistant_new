/**
 * Authentication Middleware
 * Verifies JWT tokens and extracts user information
 */

const jwt = require('jsonwebtoken');
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
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token locally first
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (jwtError) {
      throw new UnauthorizedError('Invalid token');
    }
    
    // Optionally verify with Auth Service for additional validation
    try {
      const response = await axios.post(
        `${config.services.auth}/api/auth/verify-token`,
        { token },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );
      
      if (!response.data.valid) {
        throw new UnauthorizedError('Token validation failed');
      }
      
      // Use user data from auth service if available
      req.user = response.data.user || decoded;
    } catch (authServiceError) {
      // If auth service is unavailable, use local token data
      logger.warn('Auth service unavailable, using local token validation', {
        error: authServiceError.message
      });
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    
    logger.error('Error verifying token:', error);
    next(new UnauthorizedError('Authentication failed'));
  }
};

/**
 * Middleware to check if user has required role
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }
    
    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }
    
    next();
  };
};

/**
 * Middleware to check if user can access resource
 * @param {Function} checkAccess - Function to check access
 * @returns {Function} Middleware function
 */
const checkResourceAccess = (checkAccess) => {
  return async (req, res, next) => {
    try {
      const hasAccess = await checkAccess(req.user, req.params, req.body);
      
      if (!hasAccess) {
        return next(new UnauthorizedError('Access denied to this resource'));
      }
      
      next();
    } catch (error) {
      logger.error('Error checking resource access:', error);
      next(new UnauthorizedError('Access validation failed'));
    }
  };
};

module.exports = {
  verifyToken,
  requireRole,
  checkResourceAccess
};
