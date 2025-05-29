/**
 * Authentication Middleware
 * This middleware handles authentication and authorization
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { logger } = require('../utils/logger');

// Load environment variables
require('dotenv').config();

/**
 * Authenticate user middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('No token provided'));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next(new UnauthorizedError('No token provided'));
    }

    try {
      // Verify token with Auth Service
      const response = await axios.get(
        `${process.env.AUTH_SERVICE_URL}/api/auth/me`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Set user in request
        req.user = response.data.data.user;
        next();
      } else {
        return next(new UnauthorizedError('Invalid token'));
      }
    } catch (error) {
      logger.error('Error verifying token with Auth Service', {
        error: error.message,
        stack: error.stack
      });

      if (error.response && error.response.status === 401) {
        return next(new UnauthorizedError('Invalid token'));
      }

      return next(new UnauthorizedError('Authentication failed'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize roles middleware
 * @param {Array} roles - Allowed roles
 * @returns {Function} Middleware function
 */
exports.authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Not authorized to access this resource'));
    }

    next();
  };
};
