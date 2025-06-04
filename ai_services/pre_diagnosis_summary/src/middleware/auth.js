const jwt = require('jsonwebtoken');
const axios = require('axios');
const logger = require('../utils/logger');
const { UnauthorizedError } = require('./errorHandler');

/**
 * Authentication middleware
 * Verifies JWT token and fetches user information
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    if (!decoded || !decoded.userId) {
      throw new UnauthorizedError('Invalid token');
    }

    // Fetch user details from auth service
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
      const userResponse = await axios.get(`${authServiceUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000
      });

      if (!userResponse.data.success) {
        throw new UnauthorizedError('Failed to verify user');
      }

      // Attach user to request
      req.user = userResponse.data.data;
      req.token = token;

      logger.debug('User authenticated successfully', {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role
      });

      next();
    } catch (authError) {
      logger.error('Auth service verification failed', {
        error: authError.message,
        userId: decoded.userId
      });
      
      if (authError.response?.status === 401) {
        throw new UnauthorizedError('Token expired or invalid');
      }
      
      throw new UnauthorizedError('Authentication service unavailable');
    }

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expired'));
    }

    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Doesn't throw error if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    await authMiddleware(req, res, next);
  } catch (error) {
    // Log the error but don't block the request
    logger.warn('Optional auth failed', { error: error.message });
    next();
  }
};

module.exports = {
  authMiddleware,
  authorize,
  optionalAuth
};
