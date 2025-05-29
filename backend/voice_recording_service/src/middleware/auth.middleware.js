const jwt = require('jsonwebtoken');
const axios = require('axios');
const { logger } = require('../utils/logger');
const { AuthenticationError, AuthorizationError } = require('../utils/error-handler');

/**
 * Verify JWT token middleware
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Access token required');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Verify token locally first
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid token');
      } else {
        throw new AuthenticationError('Token verification failed');
      }
    }

    // Verify with auth service if configured
    if (process.env.AUTH_SERVICE_URL) {
      try {
        const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 5000
        });

        if (response.data.success) {
          req.user = response.data.data.user;
        } else {
          throw new AuthenticationError('Token verification failed');
        }
      } catch (error) {
        if (error.response?.status === 401) {
          throw new AuthenticationError('Invalid or expired token');
        } else {
          logger.warn('Auth service verification failed, using local verification', {
            error: error.message
          });
          // Fall back to local verification
          req.user = {
            id: decoded.userId || decoded.id,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role || 'doctor',
            specialty: decoded.specialty
          };
        }
      }
    } else {
      // Use local verification only
      req.user = {
        id: decoded.userId || decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role || 'doctor',
        specialty: decoded.specialty
      };
    }

    logger.debug('User authenticated successfully', {
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role
    });

    next();
  } catch (error) {
    logger.error('Authentication failed:', error);

    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          message: error.message
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication service error'
      }
    });
  }
};

/**
 * Check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(userRole)) {
        throw new AuthorizationError(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
      }

      next();
    } catch (error) {
      logger.error('Authorization failed:', error);

      if (error instanceof AuthorizationError) {
        return res.status(403).json({
          success: false,
          error: {
            message: error.message
          }
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          message: 'Authorization service error'
        }
      });
    }
  };
};

/**
 * Check if user is doctor
 */
const requireDoctor = requireRole(['doctor', 'admin']);

/**
 * Check if user is admin
 */
const requireAdmin = requireRole('admin');

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    // Use the same logic as verifyToken but don't throw errors
    await verifyToken(req, res, next);
  } catch (error) {
    // Log the error but continue without authentication
    logger.debug('Optional authentication failed:', error.message);
    next();
  }
};

/**
 * Rate limiting middleware
 */
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [id, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(id);
      } else {
        requests.set(id, validTimestamps);
      }
    }

    // Check current client
    const clientRequests = requests.get(clientId) || [];
    const validRequests = clientRequests.filter(timestamp => timestamp > windowStart);

    if (validRequests.length >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        clientId: clientId,
        requests: validRequests.length,
        maxRequests: maxRequests
      });

      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
    }

    // Add current request
    validRequests.push(now);
    requests.set(clientId, validRequests);

    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
  requireDoctor,
  requireAdmin,
  optionalAuth,
  rateLimit
};
