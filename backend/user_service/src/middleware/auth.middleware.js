/**
 * Authentication Middleware
 * This module provides authentication middleware for the user service
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');
const { logger } = require('../utils/logger');
const { AuthenticationError, AuthorizationError } = require('../utils/error-handler');

// Load environment variables
require('dotenv').config();

/**
 * Authenticate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('Authentication required');
    }

    try {
      // Verify token with Auth Service
      const response = await axios.get(
        `${process.env.AUTH_SERVICE_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Set user in request
      req.user = response.data.data.user;

      next();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        throw new AuthenticationError('Invalid or expired token');
      }

      logger.error('Error verifying token with Auth Service', {
        error: error.message,
        stack: error.stack
      });

      throw new AuthenticationError('Authentication failed');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize user roles
 * @param {Array} roles - Allowed roles
 * @returns {Function} Middleware function
 */
exports.authorizeRoles = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user has any of the required roles
      const hasRole = roles.some(role =>
        req.user.role === role || (req.user.roles && req.user.roles.includes(role))
      );

      if (!hasRole) {
        throw new AuthorizationError('Insufficient role permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Authorize user permissions
 * @param {Array} requiredPermissions - Required permissions
 * @returns {Function} Middleware function
 */
exports.authorizePermissions = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user has all required permissions
      const hasPermissions = requiredPermissions.every(permission =>
        req.user.permissions && req.user.permissions.includes(permission)
      );

      if (!hasPermissions) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Authenticate service-to-service requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.authenticateService = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Service authentication required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('Service authentication required');
    }

    try {
      // Verify token locally (service-to-service tokens are signed with same secret)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's a service token
      if (decoded.type !== 'service') {
        throw new AuthenticationError('Invalid service token');
      }

      // Set service info in request
      req.service = {
        name: decoded.sub,
        permissions: decoded.permissions || []
      };

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Invalid or expired service token');
      }

      logger.error('Error verifying service token', {
        error: error.message,
        stack: error.stack
      });

      throw new AuthenticationError('Service authentication failed');
    }
  } catch (error) {
    next(error);
  }
};
