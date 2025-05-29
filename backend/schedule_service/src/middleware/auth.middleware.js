/**
 * Authentication Middleware
 * This middleware handles authentication and authorization
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { logger } = require('../utils/logger');

// Simple in-memory cache for token verification
const tokenCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tokenCache.entries()) {
    if (now - data.timestamp > CACHE_TTL) {
      tokenCache.delete(token);
    }
  }
}, 10 * 60 * 1000);

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
      // Check cache first
      const cached = tokenCache.get(token);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        req.user = cached.user;
        return next();
      }

      // Verify token locally using JWT
      const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_for_local_dev';

      try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Create user object from JWT payload
        const user = {
          id: decoded.sub,
          username: decoded.username || 'unknown',
          name: decoded.name || 'Unknown User',
          role: decoded.role || 'user',
          email: decoded.email || ''
        };

        // Cache the user data
        tokenCache.set(token, {
          user: user,
          timestamp: Date.now()
        });

        // Set user in request
        req.user = user;
        next();
      } catch (jwtError) {
        logger.error('JWT verification failed', {
          error: jwtError.message
        });

        // Remove from cache if invalid
        tokenCache.delete(token);
        return next(new UnauthorizedError('Invalid token'));
      }
    } catch (error) {
      logger.error('Error verifying token', {
        error: error.message,
        stack: error.stack
      });

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
