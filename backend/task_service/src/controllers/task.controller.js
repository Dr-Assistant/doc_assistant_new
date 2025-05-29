/**
 * Task Controller
 * Handles HTTP requests for task management
 */

const taskService = require('../services/task.service');
const { logger } = require('../utils/logger');

/**
 * Create a new task
 * @route POST /api/tasks
 */
exports.createTask = async (req, res, next) => {
  try {
    const taskData = req.body;
    const user = req.user;

    const task = await taskService.createTask(taskData, user);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get task by ID
 * @route GET /api/tasks/:id
 */
exports.getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const task = await taskService.getTaskById(id, user);

    res.status(200).json({
      success: true,
      data: task
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update task
 * @route PUT /api/tasks/:id
 */
exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user;

    const task = await taskService.updateTask(id, updateData, user);

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete task
 * @route DELETE /api/tasks/:id
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    await taskService.deleteTask(id, user);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks with filtering and pagination
 * @route GET /api/tasks
 */
exports.getTasks = async (req, res, next) => {
  try {
    const filters = req.query;
    const user = req.user;

    const result = await taskService.getTasks(filters, user);

    res.status(200).json({
      success: true,
      data: {
        tasks: result.tasks,
        pagination: result.pagination
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update task status
 * @route PATCH /api/tasks/:id/status
 */
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { message: 'Status is required' }
      });
    }

    const task = await taskService.updateTaskStatus(id, status, user);

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task status updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Assign task to user
 * @route PATCH /api/tasks/:id/assign
 */
exports.assignTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const user = req.user;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        error: { message: 'assignedTo is required' }
      });
    }

    const task = await taskService.assignTask(id, assignedTo, user);

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task assigned successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get pending tasks
 * @route GET /api/tasks/pending
 */
exports.getPendingTasks = async (req, res, next) => {
  try {
    const options = req.query;
    const user = req.user;

    const tasks = await taskService.getPendingTasks(options, user);

    res.status(200).json({
      success: true,
      data: tasks
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks assigned to a user
 * @route GET /api/tasks/assigned/:userId
 */
exports.getAssignedTasks = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const options = { ...req.query, assignedTo: userId };
    const user = req.user;

    const result = await taskService.getTasks(options, user);

    res.status(200).json({
      success: true,
      data: {
        tasks: result.tasks,
        pagination: result.pagination
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks created by a user
 * @route GET /api/tasks/created/:userId
 */
exports.getCreatedTasks = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const options = { ...req.query, createdBy: userId };
    const user = req.user;

    const result = await taskService.getTasks(options, user);

    res.status(200).json({
      success: true,
      data: {
        tasks: result.tasks,
        pagination: result.pagination
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks related to a patient
 * @route GET /api/tasks/patient/:patientId
 */
exports.getPatientTasks = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const options = { ...req.query, patientId };
    const user = req.user;

    const result = await taskService.getTasks(options, user);

    res.status(200).json({
      success: true,
      data: {
        tasks: result.tasks,
        pagination: result.pagination
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get overdue tasks
 * @route GET /api/tasks/overdue
 */
exports.getOverdueTasks = async (req, res, next) => {
  try {
    const options = req.query;
    const user = req.user;

    const tasks = await taskService.getOverdueTasks(options, user);

    res.status(200).json({
      success: true,
      data: tasks
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks due today
 * @route GET /api/tasks/due-today
 */
exports.getTasksDueToday = async (req, res, next) => {
  try {
    const options = req.query;
    const user = req.user;

    const tasks = await taskService.getTasksDueToday(options, user);

    res.status(200).json({
      success: true,
      data: tasks
    });

  } catch (error) {
    next(error);
  }
};
