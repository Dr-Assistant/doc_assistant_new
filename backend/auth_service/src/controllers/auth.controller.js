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
    const userData = {
      username: req.body.username,
      email: req.body.email,
      full_name: req.body.full_name,
      password: req.body.password,
      role: req.body.role,
      specialty: req.body.specialty,
      phone: req.body.phone
    };

    logger.info(`Registering user with email: ${userData.email}`);

    const result = await authService.registerUser(userData);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refresh.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh-token'
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        token: result.tokens.access.token,
        expires: result.tokens.access.expires
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
    const { username, password } = req.body;

    logger.info(`Login attempt for user: ${username}`);

    // Get device info and IP address
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      device: req.headers['user-agent'] ? req.headers['user-agent'].split('(')[1]?.split(')')[0] : 'unknown'
    };

    const ipAddress = req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket?.remoteAddress;

    const result = await authService.loginUser(username, password, {
      deviceInfo,
      ipAddress
    });

    // Check if MFA is required
    if (result.requireMFA) {
      return res.status(200).json({
        success: true,
        data: {
          requireMFA: true,
          userId: result.userId,
          tempToken: result.tempToken
        }
      });
    }

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refresh.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh-token'
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.tokens.access.token,
        expires: result.tokens.access.expires
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
};

/**
 * Verify MFA code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.verifyMFA = async (req, res, next) => {
  try {
    const { userId, code } = req.body;

    logger.info(`Verifying MFA for user: ${userId}`);

    // Get device info and IP address
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      device: req.headers['user-agent'] ? req.headers['user-agent'].split('(')[1]?.split(')')[0] : 'unknown'
    };

    const ipAddress = req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket?.remoteAddress;

    const result = await authService.verifyMFA(userId, code, {
      deviceInfo,
      ipAddress
    });

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refresh.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh-token'
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.tokens.access.token,
        expires: result.tokens.access.expires
      },
    });
  } catch (error) {
    logger.error(`MFA verification error: ${error.message}`);
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
    // User is already attached to req by the authenticate middleware
    const user = await authService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user
      },
    });
  } catch (error) {
    logger.error(`Get current user error: ${error.message}`);
    next(error);
  }
};

/**
 * Refresh access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.refreshToken = async (req, res, next) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Refresh token not found'
        }
      });
    }

    // Get device info and IP address
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      device: req.headers['user-agent'] ? req.headers['user-agent'].split('(')[1]?.split(')')[0] : 'unknown'
    };

    const ipAddress = req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket?.remoteAddress;

    const result = await authService.refreshToken(refreshToken, {
      deviceInfo,
      ipAddress
    });

    // Set new refresh token as HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refresh.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh-token'
    });

    res.status(200).json({
      success: true,
      data: {
        token: result.tokens.access.token,
        expires: result.tokens.access.expires
      },
    });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);

    // Clear the cookie if there's an error
    res.clearCookie('refreshToken', {
      path: '/api/auth/refresh-token'
    });

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
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Revoke the token
      await authService.logout(refreshToken);
    }

    // Clear the cookie
    res.clearCookie('refreshToken', {
      path: '/api/auth/refresh-token'
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully'
      },
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    next(error);
  }
};

/**
 * Logout from all devices
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.logoutAll = async (req, res, next) => {
  try {
    const result = await authService.logoutAll(req.user.id);

    // Clear the current cookie
    res.clearCookie('refreshToken', {
      path: '/api/auth/refresh-token'
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Logout all error: ${error.message}`);
    next(error);
  }
};

/**
 * Setup MFA for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.setupMFA = async (req, res, next) => {
  try {
    const result = await authService.setupMFA(req.user.id);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`MFA setup error: ${error.message}`);
    next(error);
  }
};

/**
 * Enable MFA for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.enableMFA = async (req, res, next) => {
  try {
    const { code } = req.body;

    const result = await authService.enableMFA(req.user.id, code);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`MFA enable error: ${error.message}`);
    next(error);
  }
};

/**
 * Disable MFA for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.disableMFA = async (req, res, next) => {
  try {
    const { code } = req.body;

    const result = await authService.disableMFA(req.user.id, code);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`MFA disable error: ${error.message}`);
    next(error);
  }
};
