const jwt = require('jsonwebtoken');
const axios = require('axios');
const logger = require('../utils/logger');
const { UnauthorizedError, ForbiddenError } = require('../utils/error-handler');

/**
 * Verify JWT token
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.substring(7);

    // Verify token with auth service
    try {
      const response = await axios.get(
        `${process.env.AUTH_SERVICE_URL}/api/auth/me`,
        {
          timeout: 5000,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      req.user = response.data.data.user;
      next();
    } catch (error) {
      if (error.response?.status === 401) {
        throw new UnauthorizedError('Invalid or expired token');
      }

      // Fallback to local verification if auth service is unavailable
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
      } catch (jwtError) {
        throw new UnauthorizedError('Invalid token');
      }
    }
  } catch (error) {
    logger.error('Token verification failed', {
      error: error.message,
      url: req.url
    });
    next(error);
  }
};

/**
 * Require doctor role
 */
const requireDoctor = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      throw new ForbiddenError('Doctor access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require admin role
 */
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const response = await axios.post(
        `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
        { token },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      req.user = response.data.user;
    } catch (error) {
      // Try local verification
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
      } catch (jwtError) {
        // Ignore errors for optional auth
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

module.exports = {
  verifyToken,
  requireDoctor,
  requireAdmin,
  optionalAuth
};
