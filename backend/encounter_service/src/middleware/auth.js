/**
 * Authentication Middleware
 * Handles JWT token validation and user authentication
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');
const { logger } = require('../utils/logger');

// Cache for validated tokens to reduce auth service calls
const tokenCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Middleware to authenticate requests using JWT tokens
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.logSecurityEvent('missing_auth_token', null, req.ip, {
        url: req.url,
        method: req.method
      });
      
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: {
          code: 'MISSING_TOKEN',
          details: 'Authorization header with Bearer token is required'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check cache first
    const cachedUser = tokenCache.get(token);
    if (cachedUser && Date.now() - cachedUser.timestamp < CACHE_DURATION) {
      req.user = cachedUser.user;
      return next();
    }

    // Verify token locally first (for basic validation)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    } catch (jwtError) {
      logger.logSecurityEvent('invalid_jwt_token', null, req.ip, {
        error: jwtError.message,
        url: req.url
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: {
          code: 'INVALID_TOKEN',
          details: 'Token verification failed'
        }
      });
    }

    // Validate token with auth service for additional security
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
      const response = await axios.post(
        `${authServiceUrl}/api/auth/validate`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        }
      );

      if (response.data.success && response.data.data.user) {
        const user = response.data.data.user;
        
        // Cache the validated user
        tokenCache.set(token, {
          user,
          timestamp: Date.now()
        });

        // Clean up old cache entries periodically
        if (tokenCache.size > 1000) {
          const now = Date.now();
          for (const [key, value] of tokenCache.entries()) {
            if (now - value.timestamp > CACHE_DURATION) {
              tokenCache.delete(key);
            }
          }
        }

        req.user = user;
        
        logger.logUserAction(user.id, 'api_access', req.url, {
          method: req.method,
          ip: req.ip
        });
        
        return next();
      } else {
        throw new Error('Invalid response from auth service');
      }
    } catch (authServiceError) {
      logger.logError(authServiceError, {
        context: 'auth_service_validation',
        token: token.substring(0, 20) + '...',
        url: req.url
      });

      // If auth service is down, fall back to local JWT validation
      if (decoded && decoded.id) {
        logger.warn('Auth service unavailable, using local JWT validation', {
          userId: decoded.id,
          url: req.url
        });
        
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role || 'user',
          name: decoded.name || 'Unknown User'
        };
        
        return next();
      }

      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: {
          code: 'AUTH_FAILED',
          details: 'Unable to validate token'
        }
      });
    }
  } catch (error) {
    logger.logError(error, {
      context: 'auth_middleware',
      url: req.url,
      method: req.method
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error: {
        code: 'AUTH_ERROR',
        details: 'Authentication service error'
      }
    });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: {
          code: 'NOT_AUTHENTICATED',
          details: 'User must be authenticated to access this resource'
        }
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.logSecurityEvent('insufficient_permissions', req.user.id, req.ip, {
        requiredRoles: allowedRoles,
        userRole,
        url: req.url
      });

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          details: `Required role: ${allowedRoles.join(' or ')}, current role: ${userRole}`
        }
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has permission to access specific patient data
 */
const requirePatientAccess = async (req, res, next) => {
  try {
    const patientId = req.params.patientId || req.body.patientId || req.query.patientId;
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
        error: {
          code: 'MISSING_PATIENT_ID',
          details: 'Patient ID must be provided in request'
        }
      });
    }

    // For now, allow all authenticated healthcare providers access
    // In a real implementation, you would check specific patient-provider relationships
    const allowedRoles = ['doctor', 'nurse', 'admin', 'healthcare_provider'];
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.logSecurityEvent('unauthorized_patient_access', req.user.id, req.ip, {
        patientId,
        userRole: req.user.role,
        url: req.url
      });

      return res.status(403).json({
        success: false,
        message: 'Not authorized to access patient data',
        error: {
          code: 'UNAUTHORIZED_PATIENT_ACCESS',
          details: 'User does not have permission to access this patient\'s data'
        }
      });
    }

    req.patientId = patientId;
    next();
  } catch (error) {
    logger.logError(error, {
      context: 'patient_access_check',
      userId: req.user?.id,
      url: req.url
    });

    return res.status(500).json({
      success: false,
      message: 'Error checking patient access permissions',
      error: {
        code: 'PATIENT_ACCESS_ERROR',
        details: 'Unable to verify patient access permissions'
      }
    });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }

  // Use the main auth middleware but catch errors
  try {
    await authMiddleware(req, res, next);
  } catch (error) {
    // Log the error but continue without authentication
    logger.warn('Optional authentication failed', {
      error: error.message,
      url: req.url
    });
    next();
  }
};

module.exports = {
  authMiddleware,
  requireRole,
  requirePatientAccess,
  optionalAuth
};
