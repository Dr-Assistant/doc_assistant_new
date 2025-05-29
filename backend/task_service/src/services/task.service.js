/**
 * Task Service
 * Handles task management operations
 */

const { Task } = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../utils/logger');
const config = require('../config');
const {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ValidationError
} = require('../middleware/error.middleware');

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @param {Object} user - User creating the task
 * @returns {Promise<Object>} Created task
 */
exports.createTask = async (taskData, user) => {
  try {
    // Validate task data
    validateTaskData(taskData);

    const userId = user.id || user.sub; // Handle both id and sub fields

    // Prepare task data
    const task = await Task.create({
      title: taskData.title,
      description: taskData.description,
      assignedTo: taskData.assignedTo || null,
      createdBy: userId,
      patientId: taskData.patientId || null,
      encounterId: taskData.encounterId || null,
      dueDate: taskData.dueDate || null,
      priority: taskData.priority || config.task.defaultPriority,
      taskType: taskData.taskType,
      status: 'pending'
    });

    logger.info('Task created successfully', {
      taskId: task.id,
      title: task.title,
      createdBy: userId,
      assignedTo: task.assignedTo
    });

    return task.getDisplayInfo();

  } catch (error) {
    if (error instanceof BadRequestError || error instanceof ValidationError) {
      throw error;
    }

    logger.error('Error creating task:', error);
    throw new Error('Failed to create task');
  }
};

/**
 * Get task by ID
 * @param {string} taskId - Task ID
 * @param {Object} user - User requesting the task
 * @returns {Promise<Object>} Task details
 */
exports.getTaskById = async (taskId, user) => {
  try {
    const task = await Task.findByPk(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user has access to this task
    if (!canUserAccessTask(task, user)) {
      throw new NotFoundError('Task not found');
    }

    return task.getDisplayInfo();

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    logger.error('Error getting task by ID:', error);
    throw new Error('Failed to get task');
  }
};

/**
 * Update task
 * @param {string} taskId - Task ID
 * @param {Object} updateData - Update data
 * @param {Object} user - User updating the task
 * @returns {Promise<Object>} Updated task
 */
exports.updateTask = async (taskId, updateData, user) => {
  try {
    const task = await Task.findByPk(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user can update this task
    if (!canUserUpdateTask(task, user)) {
      throw new ConflictError('You do not have permission to update this task');
    }

    // Validate update data
    validateUpdateData(updateData);

    // Update task
    const updatedTask = await task.update({
      title: updateData.title !== undefined ? updateData.title : task.title,
      description: updateData.description !== undefined ? updateData.description : task.description,
      assignedTo: updateData.assignedTo !== undefined ? updateData.assignedTo : task.assignedTo,
      patientId: updateData.patientId !== undefined ? updateData.patientId : task.patientId,
      encounterId: updateData.encounterId !== undefined ? updateData.encounterId : task.encounterId,
      dueDate: updateData.dueDate !== undefined ? updateData.dueDate : task.dueDate,
      priority: updateData.priority !== undefined ? updateData.priority : task.priority,
      taskType: updateData.taskType !== undefined ? updateData.taskType : task.taskType,
      status: updateData.status !== undefined ? updateData.status : task.status
    });

    const userId = user.id || user.sub; // Handle both id and sub fields
    logger.info('Task updated successfully', {
      taskId: task.id,
      updatedBy: userId,
      changes: Object.keys(updateData)
    });

    return updatedTask.getDisplayInfo();

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof ValidationError) {
      throw error;
    }

    logger.error('Error updating task:', error);
    throw new Error('Failed to update task');
  }
};

/**
 * Delete task
 * @param {string} taskId - Task ID
 * @param {Object} user - User deleting the task
 * @returns {Promise<boolean>} Success status
 */
exports.deleteTask = async (taskId, user) => {
  try {
    const task = await Task.findByPk(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user can delete this task
    if (!canUserDeleteTask(task, user)) {
      throw new ConflictError('You do not have permission to delete this task');
    }

    await task.destroy();

    const userId = user.id || user.sub; // Handle both id and sub fields
    logger.info('Task deleted successfully', {
      taskId: task.id,
      deletedBy: userId
    });

    return true;

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }

    logger.error('Error deleting task:', error);
    throw new Error('Failed to delete task');
  }
};

/**
 * Get tasks with filtering and pagination
 * @param {Object} filters - Filter options
 * @param {Object} user - User requesting tasks
 * @returns {Promise<Object>} Tasks and pagination info
 */
exports.getTasks = async (filters, user) => {
  try {
    const {
      status,
      priority,
      taskType,
      assignedTo,
      createdBy,
      patientId,
      encounterId,
      dueDateFrom,
      dueDateTo,
      page = 1,
      limit = 20
    } = filters;

    // Build where clause
    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (taskType) where.taskType = taskType;
    if (assignedTo) where.assignedTo = assignedTo;
    if (createdBy) where.createdBy = createdBy;
    if (patientId) where.patientId = patientId;
    if (encounterId) where.encounterId = encounterId;

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) where.dueDate[Op.gte] = new Date(dueDateFrom);
      if (dueDateTo) where.dueDate[Op.lte] = new Date(dueDateTo);
    }

    // Add user access filter
    addUserAccessFilter(where, user);

    const offset = (page - 1) * limit;
    const limitValue = Math.min(limit, config.task.maxTasksPerPage);

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      order: [
        ['priority', 'ASC'],
        ['due_date', 'ASC'],
        ['created_at', 'DESC']
      ],
      limit: limitValue,
      offset
    });

    return {
      tasks: tasks.map(task => task.getDisplayInfo()),
      pagination: {
        page: parseInt(page),
        limit: limitValue,
        total: count,
        pages: Math.ceil(count / limitValue)
      }
    };

  } catch (error) {
    logger.error('Error getting tasks:', error);
    throw new Error('Failed to get tasks');
  }
};

/**
 * Update task status
 * @param {string} taskId - Task ID
 * @param {string} status - New status
 * @param {Object} user - User updating status
 * @returns {Promise<Object>} Updated task
 */
exports.updateTaskStatus = async (taskId, status, user) => {
  try {
    const task = await Task.findByPk(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user can update this task
    if (!canUserUpdateTask(task, user)) {
      throw new ConflictError('You do not have permission to update this task');
    }

    // Validate status transition
    if (!isValidStatusTransition(task.status, status)) {
      throw new ValidationError(`Cannot change status from ${task.status} to ${status}`);
    }

    const updatedTask = await task.update({ status });

    const userId = user.id || user.sub; // Handle both id and sub fields
    logger.info('Task status updated', {
      taskId: task.id,
      oldStatus: task.status,
      newStatus: status,
      updatedBy: userId
    });

    return updatedTask.getDisplayInfo();

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof ValidationError) {
      throw error;
    }

    logger.error('Error updating task status:', error);
    throw new Error('Failed to update task status');
  }
};

/**
 * Assign task to user
 * @param {string} taskId - Task ID
 * @param {string} assigneeId - User ID to assign to
 * @param {Object} user - User making the assignment
 * @returns {Promise<Object>} Updated task
 */
exports.assignTask = async (taskId, assigneeId, user) => {
  try {
    const task = await Task.findByPk(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user can assign this task
    if (!canUserAssignTask(task, user)) {
      throw new ConflictError('You do not have permission to assign this task');
    }

    // Check if task can be assigned
    if (!task.canBeAssigned()) {
      throw new ConflictError('Task cannot be assigned in its current status');
    }

    const updatedTask = await task.update({ assignedTo: assigneeId });

    const userId = user.id || user.sub; // Handle both id and sub fields
    logger.info('Task assigned', {
      taskId: task.id,
      assignedTo: assigneeId,
      assignedBy: userId
    });

    return updatedTask.getDisplayInfo();

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error;
    }

    logger.error('Error assigning task:', error);
    throw new Error('Failed to assign task');
  }
};

/**
 * Get pending tasks
 * @param {Object} options - Query options
 * @param {Object} user - User requesting tasks
 * @returns {Promise<Array>} Pending tasks
 */
exports.getPendingTasks = async (options, user) => {
  try {
    const userId = user.id || user.sub; // Handle both id and sub fields
    const tasks = await Task.findPending({
      ...options,
      assignedTo: options.assignedTo || userId // Default to current user
    });

    return tasks.map(task => task.getDisplayInfo());

  } catch (error) {
    logger.error('Error getting pending tasks:', error);
    throw new Error('Failed to get pending tasks');
  }
};

/**
 * Get overdue tasks
 * @param {Object} options - Query options
 * @param {Object} user - User requesting tasks
 * @returns {Promise<Array>} Overdue tasks
 */
exports.getOverdueTasks = async (options, user) => {
  try {
    const userId = user.id || user.sub; // Handle both id and sub fields
    const tasks = await Task.findOverdue({
      ...options,
      assignedTo: options.assignedTo || userId // Default to current user
    });

    return tasks.map(task => task.getDisplayInfo());

  } catch (error) {
    logger.error('Error getting overdue tasks:', error);
    throw new Error('Failed to get overdue tasks');
  }
};

/**
 * Get tasks due today
 * @param {Object} options - Query options
 * @param {Object} user - User requesting tasks
 * @returns {Promise<Array>} Tasks due today
 */
exports.getTasksDueToday = async (options, user) => {
  try {
    const userId = user.id || user.sub; // Handle both id and sub fields
    const tasks = await Task.findDueToday({
      ...options,
      assignedTo: options.assignedTo || userId // Default to current user
    });

    return tasks.map(task => task.getDisplayInfo());

  } catch (error) {
    logger.error('Error getting tasks due today:', error);
    throw new Error('Failed to get tasks due today');
  }
};

// Helper functions

function validateTaskData(taskData) {
  const required = ['title', 'taskType'];

  for (const field of required) {
    if (!taskData[field]) {
      throw new BadRequestError(`Missing required field: ${field}`);
    }
  }

  if (taskData.title && taskData.title.length > 100) {
    throw new ValidationError('Title must be 100 characters or less');
  }

  if (taskData.dueDate) {
    const dueDate = new Date(taskData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    if (dueDate < today) {
      throw new ValidationError('Due date cannot be in the past');
    }
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (taskData.priority && !validPriorities.includes(taskData.priority)) {
    throw new ValidationError('Invalid priority value');
  }

  const validTaskTypes = ['documentation', 'review', 'follow_up', 'referral', 'order', 'other'];
  if (taskData.taskType && !validTaskTypes.includes(taskData.taskType)) {
    throw new ValidationError('Invalid task type');
  }
}

function validateUpdateData(updateData) {
  if (updateData.title && updateData.title.length > 100) {
    throw new ValidationError('Title must be 100 characters or less');
  }

  if (updateData.dueDate) {
    const dueDate = new Date(updateData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    if (dueDate < today) {
      throw new ValidationError('Due date cannot be in the past');
    }
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (updateData.priority && !validPriorities.includes(updateData.priority)) {
    throw new ValidationError('Invalid priority value');
  }

  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  if (updateData.status && !validStatuses.includes(updateData.status)) {
    throw new ValidationError('Invalid status value');
  }

  const validTaskTypes = ['documentation', 'review', 'follow_up', 'referral', 'order', 'other'];
  if (updateData.taskType && !validTaskTypes.includes(updateData.taskType)) {
    throw new ValidationError('Invalid task type');
  }
}

function canUserAccessTask(task, user) {
  // User can access task if they created it, it's assigned to them, or they're an admin
  const userId = user.id || user.sub; // Handle both id and sub fields
  return task.createdBy === userId ||
         task.assignedTo === userId ||
         user.role === 'admin';
}

function canUserUpdateTask(task, user) {
  // User can update task if they created it, it's assigned to them, or they're an admin
  const userId = user.id || user.sub; // Handle both id and sub fields
  return task.createdBy === userId ||
         task.assignedTo === userId ||
         user.role === 'admin';
}

function canUserDeleteTask(task, user) {
  // User can delete task if they created it or they're an admin
  const userId = user.id || user.sub; // Handle both id and sub fields
  return task.createdBy === userId || user.role === 'admin';
}

function canUserAssignTask(task, user) {
  // User can assign task if they created it or they're an admin
  const userId = user.id || user.sub; // Handle both id and sub fields
  return task.createdBy === userId || user.role === 'admin';
}

function addUserAccessFilter(where, user) {
  // If not admin, only show tasks user created or is assigned to
  const userId = user.id || user.sub; // Handle both id and sub fields
  if (user.role !== 'admin') {
    where[Op.or] = [
      { createdBy: userId },
      { assignedTo: userId }
    ];
  }
}

function isValidStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    'pending': ['in_progress', 'completed', 'cancelled'],
    'in_progress': ['completed', 'cancelled', 'pending'],
    'completed': [], // Completed tasks cannot be changed
    'cancelled': ['pending'] // Cancelled tasks can be reopened
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}
