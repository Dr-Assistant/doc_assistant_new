const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middleware/validate-request');
const {
  authenticate,
  authorizeRoles,
  authorizePermissions
} = require('../middleware/auth.middleware');
const cookieParser = require('cookie-parser');

const router = express.Router();

// Apply cookie parser middleware
router.use(cookieParser());

// Register a new user
router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters long')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[^A-Za-z0-9]/)
      .withMessage('Password must contain at least one special character'),
    body('full_name')
      .notEmpty()
      .withMessage('Full name is required'),
    body('role')
      .optional()
      .isIn(['doctor', 'nurse', 'admin', 'receptionist'])
      .withMessage('Invalid role'),
    validateRequest,
  ],
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('username')
      .notEmpty()
      .withMessage('Username or email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validateRequest,
  ],
  authController.login
);

// Verify MFA
router.post(
  '/verify-mfa',
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required'),
    body('code')
      .notEmpty()
      .withMessage('Verification code is required')
      .isLength({ min: 6, max: 10 })
      .withMessage('Invalid verification code format'),
    validateRequest,
  ],
  authController.verifyMFA
);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Logout
router.post('/logout', authenticate, authController.logout);

// Logout from all devices
router.post('/logout-all', authenticate, authController.logoutAll);

// MFA setup
router.post('/mfa/setup', authenticate, authController.setupMFA);

// Enable MFA
router.post(
  '/mfa/enable',
  [
    body('code')
      .notEmpty()
      .withMessage('Verification code is required')
      .isLength({ min: 6, max: 10 })
      .withMessage('Invalid verification code format'),
    validateRequest,
  ],
  authenticate,
  authController.enableMFA
);

// Disable MFA
router.post(
  '/mfa/disable',
  [
    body('code')
      .notEmpty()
      .withMessage('Verification code is required')
      .isLength({ min: 6, max: 10 })
      .withMessage('Invalid verification code format'),
    validateRequest,
  ],
  authenticate,
  authController.disableMFA
);

module.exports = router;
