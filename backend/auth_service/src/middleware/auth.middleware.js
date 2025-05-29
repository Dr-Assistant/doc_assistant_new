const { logger } = require('../utils/logger');
const { User, Role, Permission } = require('../models');
const { verifyToken } = require('../utils/jwt');
const { AuthenticationError, AuthorizationError } = require('../utils/error-handler');

/**
 * Authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token, authorization denied');
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = verifyToken(token, process.env.JWT_SECRET);

    // Check token type
    if (decoded.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }

    // Find user
    const user = await User.findByPk(decoded.sub, {
      include: [{
        model: Role,
        as: 'roles',
        include: [{
          model: Permission,
          as: 'permissions'
        }]
      }]
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new AuthenticationError(`User account is ${user.status}`);
    }

    // Format permissions
    const permissions = user.roles.reduce((acc, role) => {
      role.permissions.forEach(permission => {
        acc.push(`${permission.resource}:${permission.action}`);
      });
      return acc;
    }, []);

    // Add user and permissions to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      roles: user.roles.map(role => role.name),
      permissions,
      tokenId: decoded.jti
    };

    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);

    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          message: error.message
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication failed'
      }
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user has any of the required roles
      const hasRole = roles.some(role =>
        req.user.role === role || req.user.roles.includes(role)
      );

      if (!hasRole) {
        throw new AuthorizationError('Insufficient role permissions');
      }

      next();
    } catch (error) {
      logger.error(`Authorization error: ${error.message}`);

      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          error: {
            message: error.message
          }
        });
      }

      if (error instanceof AuthorizationError) {
        return res.status(403).json({
          success: false,
          error: {
            message: error.message
          }
        });
      }

      return res.status(403).json({
        success: false,
        error: {
          message: 'Authorization failed'
        }
      });
    }
  };
};

/**
 * Permission-based authorization middleware
 * @param {string[]} requiredPermissions - Array of required permissions (format: 'resource:action')
 * @returns {Function} Middleware function
 */
const authorizePermissions = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user has all required permissions
      const hasPermissions = requiredPermissions.every(permission =>
        req.user.permissions.includes(permission)
      );

      if (!hasPermissions) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      logger.error(`Authorization error: ${error.message}`);

      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          error: {
            message: error.message
          }
        });
      }

      if (error instanceof AuthorizationError) {
        return res.status(403).json({
          success: false,
          error: {
            message: error.message
          }
        });
      }

      return res.status(403).json({
        success: false,
        error: {
          message: 'Authorization failed'
        }
      });
    }
  };
};

module.exports = {
  authenticate,
  authorizeRoles,
  authorizePermissions,
  // Legacy alias for backward compatibility
  authorize: authorizeRoles
};
