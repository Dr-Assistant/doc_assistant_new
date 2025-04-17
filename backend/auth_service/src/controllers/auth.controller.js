const { logger } = require('../utils/logger');
const authService = require('../services/auth.service');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    logger.info(`Registering user with email: ${email}`);
    
    const result = await authService.registerUser(name, email, password);
    
    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    next(error);
  }
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    logger.info(`Login attempt for user: ${email}`);
    
    const result = await authService.loginUser(email, password);
    
    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
};

/**
 * Get current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // This will be implemented with authentication middleware
    res.status(200).json({
      success: true,
      data: {
        message: 'Current user endpoint - to be implemented',
      },
    });
  } catch (error) {
    logger.error(`Get current user error: ${error.message}`);
    next(error);
  }
};

/**
 * Refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.refreshToken = async (req, res, next) => {
  try {
    // This will be implemented with token refresh logic
    res.status(200).json({
      success: true,
      data: {
        message: 'Refresh token endpoint - to be implemented',
      },
    });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    next(error);
  }
};

/**
 * Logout a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.logout = async (req, res, next) => {
  try {
    // This will be implemented with logout logic
    res.status(200).json({
      success: true,
      data: {
        message: 'Logout endpoint - to be implemented',
      },
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    next(error);
  }
};
