/**
 * User Routes
 * This module defines the routes for user management
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate, authorizeRoles, authenticateService } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');

const router = express.Router();

// Internal endpoint for service-to-service user creation
router.post(
  '/internal/create',
  [
    body('id').isUUID().withMessage('Invalid user ID'),
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('full_name')
      .notEmpty()
      .withMessage('Full name is required'),
    body('role')
      .optional()
      .isIn(['doctor', 'nurse', 'admin', 'receptionist'])
      .withMessage('Invalid role'),
    body('specialty')
      .optional()
      .isString()
      .withMessage('Specialty must be a string'),
    body('phone')
      .optional()
      .isString()
      .withMessage('Phone must be a string'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended', 'pending'])
      .withMessage('Invalid status'),
    validateRequest
  ],
  authenticateService,
  userController.createUserInternal
);

// Get all users
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('role').optional().isIn(['doctor', 'nurse', 'admin', 'receptionist']).withMessage('Invalid role'),
    query('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']).withMessage('Invalid status'),
    query('sort').optional().isIn(['full_name', 'username', 'email', 'role', 'status', 'createdAt']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['ASC', 'DESC']).withMessage('Order must be ASC or DESC'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['admin']),
  userController.getAllUsers
);

// Get current user (must be before /:id route)
router.get(
  '/me',
  authenticate,
  userController.getCurrentUser
);

// Update current user
router.put(
  '/me',
  [
    body('full_name')
      .optional()
      .notEmpty()
      .withMessage('Full name is required'),
    body('specialty')
      .optional()
      .isString()
      .withMessage('Specialty must be a string'),
    body('phone')
      .optional()
      .isString()
      .withMessage('Phone must be a string'),
    validateRequest
  ],
  authenticate,
  userController.updateCurrentUser
);

// Update user preferences
router.put(
  '/me/preferences',
  authenticate,
  userController.updateUserPreferences
);

// Get user preferences
router.get(
  '/me/preferences',
  authenticate,
  userController.getUserPreferences
);

// Get user by ID
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['admin']),
  userController.getUserById
);

// Create a new user
router.post(
  '/',
  [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('full_name')
      .notEmpty()
      .withMessage('Full name is required'),
    body('role')
      .optional()
      .isIn(['doctor', 'nurse', 'admin', 'receptionist'])
      .withMessage('Invalid role'),
    body('specialty')
      .optional()
      .isString()
      .withMessage('Specialty must be a string'),
    body('phone')
      .optional()
      .isString()
      .withMessage('Phone must be a string'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended', 'pending'])
      .withMessage('Invalid status'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['admin']),
  userController.createUser
);

// Update user
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('full_name')
      .optional()
      .notEmpty()
      .withMessage('Full name is required'),
    body('role')
      .optional()
      .isIn(['doctor', 'nurse', 'admin', 'receptionist'])
      .withMessage('Invalid role'),
    body('specialty')
      .optional()
      .isString()
      .withMessage('Specialty must be a string'),
    body('phone')
      .optional()
      .isString()
      .withMessage('Phone must be a string'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended', 'pending'])
      .withMessage('Invalid status'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['admin']),
  userController.updateUser
);

// Delete user
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    validateRequest
  ],
  authenticate,
  authorizeRoles(['admin']),
  userController.deleteUser
);

module.exports = router;
