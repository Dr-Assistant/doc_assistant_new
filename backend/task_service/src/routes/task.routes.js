/**
 * Task Routes
 * Defines routes for task management
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const taskController = require('../controllers/task.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

/**
 * @route POST /api/tasks
 * @desc Create a new task
 * @access Private
 */
router.post('/',
  verifyToken,
  [
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 100 })
      .withMessage('Title must be 100 characters or less'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be 1000 characters or less'),
    body('assignedTo')
      .optional()
      .isUUID()
      .withMessage('Assigned to must be a valid UUID'),
    body('patientId')
      .optional()
      .isUUID()
      .withMessage('Patient ID must be a valid UUID'),
    body('encounterId')
      .optional()
      .isUUID()
      .withMessage('Encounter ID must be a valid UUID'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid ISO date'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be one of: low, medium, high, urgent'),
    body('taskType')
      .notEmpty()
      .withMessage('Task type is required')
      .isIn(['documentation', 'review', 'follow_up', 'referral', 'order', 'other'])
      .withMessage('Task type must be one of: documentation, review, follow_up, referral, order, other')
  ],
  validate,
  taskController.createTask
);

/**
 * @route GET /api/tasks
 * @desc Get tasks with filtering and pagination
 * @access Private
 */
router.get('/',
  verifyToken,
  [
    query('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Status must be one of: pending, in_progress, completed, cancelled'),
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be one of: low, medium, high, urgent'),
    query('taskType')
      .optional()
      .isIn(['documentation', 'review', 'follow_up', 'referral', 'order', 'other'])
      .withMessage('Task type must be one of: documentation, review, follow_up, referral, order, other'),
    query('assignedTo')
      .optional()
      .isUUID()
      .withMessage('Assigned to must be a valid UUID'),
    query('createdBy')
      .optional()
      .isUUID()
      .withMessage('Created by must be a valid UUID'),
    query('patientId')
      .optional()
      .isUUID()
      .withMessage('Patient ID must be a valid UUID'),
    query('encounterId')
      .optional()
      .isUUID()
      .withMessage('Encounter ID must be a valid UUID'),
    query('dueDateFrom')
      .optional()
      .isISO8601()
      .withMessage('Due date from must be a valid ISO date'),
    query('dueDateTo')
      .optional()
      .isISO8601()
      .withMessage('Due date to must be a valid ISO date'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  validate,
  taskController.getTasks
);

/**
 * @route GET /api/tasks/pending
 * @desc Get pending tasks
 * @access Private
 */
router.get('/pending',
  verifyToken,
  [
    query('assignedTo')
      .optional()
      .isUUID()
      .withMessage('Assigned to must be a valid UUID'),
    query('taskType')
      .optional()
      .isIn(['documentation', 'review', 'follow_up', 'referral', 'order', 'other'])
      .withMessage('Task type must be one of: documentation, review, follow_up, referral, order, other'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  validate,
  taskController.getPendingTasks
);

/**
 * @route GET /api/tasks/overdue
 * @desc Get overdue tasks
 * @access Private
 */
router.get('/overdue',
  verifyToken,
  [
    query('assignedTo')
      .optional()
      .isUUID()
      .withMessage('Assigned to must be a valid UUID'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  validate,
  taskController.getOverdueTasks
);

/**
 * @route GET /api/tasks/due-today
 * @desc Get tasks due today
 * @access Private
 */
router.get('/due-today',
  verifyToken,
  [
    query('assignedTo')
      .optional()
      .isUUID()
      .withMessage('Assigned to must be a valid UUID'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  validate,
  taskController.getTasksDueToday
);

/**
 * @route GET /api/tasks/assigned/:userId
 * @desc Get tasks assigned to a user
 * @access Private
 */
router.get('/assigned/:userId',
  verifyToken,
  [
    param('userId')
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    query('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Status must be one of: pending, in_progress, completed, cancelled'),
    query('taskType')
      .optional()
      .isIn(['documentation', 'review', 'follow_up', 'referral', 'order', 'other'])
      .withMessage('Task type must be one of: documentation, review, follow_up, referral, order, other'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  validate,
  taskController.getAssignedTasks
);

/**
 * @route GET /api/tasks/created/:userId
 * @desc Get tasks created by a user
 * @access Private
 */
router.get('/created/:userId',
  verifyToken,
  [
    param('userId')
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    query('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Status must be one of: pending, in_progress, completed, cancelled'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  validate,
  taskController.getCreatedTasks
);

/**
 * @route GET /api/tasks/patient/:patientId
 * @desc Get tasks related to a patient
 * @access Private
 */
router.get('/patient/:patientId',
  verifyToken,
  [
    param('patientId')
      .isUUID()
      .withMessage('Patient ID must be a valid UUID'),
    query('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Status must be one of: pending, in_progress, completed, cancelled'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  validate,
  taskController.getPatientTasks
);

/**
 * @route GET /api/tasks/:id
 * @desc Get task by ID
 * @access Private
 */
router.get('/:id',
  verifyToken,
  [
    param('id')
      .isUUID()
      .withMessage('Task ID must be a valid UUID')
  ],
  validate,
  taskController.getTaskById
);

/**
 * @route PUT /api/tasks/:id
 * @desc Update task
 * @access Private
 */
router.put('/:id',
  verifyToken,
  [
    param('id')
      .isUUID()
      .withMessage('Task ID must be a valid UUID'),
    body('title')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be 1000 characters or less'),
    body('assignedTo')
      .optional()
      .isUUID()
      .withMessage('Assigned to must be a valid UUID'),
    body('patientId')
      .optional()
      .isUUID()
      .withMessage('Patient ID must be a valid UUID'),
    body('encounterId')
      .optional()
      .isUUID()
      .withMessage('Encounter ID must be a valid UUID'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid ISO date'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be one of: low, medium, high, urgent'),
    body('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Status must be one of: pending, in_progress, completed, cancelled'),
    body('taskType')
      .optional()
      .isIn(['documentation', 'review', 'follow_up', 'referral', 'order', 'other'])
      .withMessage('Task type must be one of: documentation, review, follow_up, referral, order, other')
  ],
  validate,
  taskController.updateTask
);

/**
 * @route DELETE /api/tasks/:id
 * @desc Delete task
 * @access Private
 */
router.delete('/:id',
  verifyToken,
  [
    param('id')
      .isUUID()
      .withMessage('Task ID must be a valid UUID')
  ],
  validate,
  taskController.deleteTask
);

/**
 * @route PATCH /api/tasks/:id/status
 * @desc Update task status
 * @access Private
 */
router.patch('/:id/status',
  verifyToken,
  [
    param('id')
      .isUUID()
      .withMessage('Task ID must be a valid UUID'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Status must be one of: pending, in_progress, completed, cancelled')
  ],
  validate,
  taskController.updateTaskStatus
);

/**
 * @route PATCH /api/tasks/:id/assign
 * @desc Assign task to user
 * @access Private
 */
router.patch('/:id/assign',
  verifyToken,
  [
    param('id')
      .isUUID()
      .withMessage('Task ID must be a valid UUID'),
    body('assignedTo')
      .notEmpty()
      .withMessage('Assigned to is required')
      .isUUID()
      .withMessage('Assigned to must be a valid UUID')
  ],
  validate,
  taskController.assignTask
);

module.exports = router;
