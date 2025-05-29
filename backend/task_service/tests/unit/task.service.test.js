/**
 * Task Service Unit Tests
 */

const { 
  createTask, 
  getTaskById, 
  updateTask, 
  deleteTask, 
  getTasks,
  updateTaskStatus,
  assignTask,
  getPendingTasks,
  getOverdueTasks,
  getTasksDueToday
} = require('../../src/services/task.service');
const { Task } = require('../../src/models');
const { BadRequestError, NotFoundError, ConflictError, ValidationError } = require('../../src/middleware/error.middleware');

// Mock the Task model
jest.mock('../../src/models');

describe('Task Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    const mockUser = { id: 'user-123', role: 'doctor' };
    const validTaskData = {
      title: 'Test Task',
      description: 'Test Description',
      taskType: 'documentation',
      priority: 'medium',
      dueDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
    };

    it('should create a task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        ...validTaskData,
        createdBy: mockUser.id,
        status: 'pending',
        getDisplayInfo: jest.fn().mockReturnValue({
          id: 'task-123',
          title: 'Test Task',
          status: 'pending'
        })
      };

      Task.create.mockResolvedValue(mockTask);

      const result = await createTask(validTaskData, mockUser);

      expect(Task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: validTaskData.title,
          description: validTaskData.description,
          createdBy: mockUser.id,
          taskType: validTaskData.taskType,
          priority: validTaskData.priority,
          status: 'pending'
        })
      );

      expect(result).toEqual({
        id: 'task-123',
        title: 'Test Task',
        status: 'pending'
      });
    });

    it('should throw BadRequestError for missing title', async () => {
      const invalidData = { ...validTaskData };
      delete invalidData.title;

      await expect(createTask(invalidData, mockUser))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError for missing taskType', async () => {
      const invalidData = { ...validTaskData };
      delete invalidData.taskType;

      await expect(createTask(invalidData, mockUser))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw ValidationError for title too long', async () => {
      const invalidData = {
        ...validTaskData,
        title: 'a'.repeat(101) // 101 characters
      };

      await expect(createTask(invalidData, mockUser))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for past due date', async () => {
      const invalidData = {
        ...validTaskData,
        dueDate: new Date(Date.now() - 86400000).toISOString() // Yesterday
      };

      await expect(createTask(invalidData, mockUser))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid priority', async () => {
      const invalidData = {
        ...validTaskData,
        priority: 'invalid'
      };

      await expect(createTask(invalidData, mockUser))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid task type', async () => {
      const invalidData = {
        ...validTaskData,
        taskType: 'invalid'
      };

      await expect(createTask(invalidData, mockUser))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getTaskById', () => {
    const mockUser = { id: 'user-123', role: 'doctor' };

    it('should return task when user has access', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        createdBy: mockUser.id,
        assignedTo: null,
        getDisplayInfo: jest.fn().mockReturnValue({
          id: 'task-123',
          title: 'Test Task'
        })
      };

      Task.findByPk.mockResolvedValue(mockTask);

      const result = await getTaskById('task-123', mockUser);

      expect(Task.findByPk).toHaveBeenCalledWith('task-123');
      expect(result).toEqual({
        id: 'task-123',
        title: 'Test Task'
      });
    });

    it('should throw NotFoundError when task does not exist', async () => {
      Task.findByPk.mockResolvedValue(null);

      await expect(getTaskById('nonexistent', mockUser))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when user has no access', async () => {
      const mockTask = {
        id: 'task-123',
        createdBy: 'other-user',
        assignedTo: 'another-user'
      };

      Task.findByPk.mockResolvedValue(mockTask);

      await expect(getTaskById('task-123', mockUser))
        .rejects.toThrow(NotFoundError);
    });

    it('should allow admin to access any task', async () => {
      const adminUser = { id: 'admin-123', role: 'admin' };
      const mockTask = {
        id: 'task-123',
        createdBy: 'other-user',
        assignedTo: 'another-user',
        getDisplayInfo: jest.fn().mockReturnValue({
          id: 'task-123',
          title: 'Test Task'
        })
      };

      Task.findByPk.mockResolvedValue(mockTask);

      const result = await getTaskById('task-123', adminUser);

      expect(result).toEqual({
        id: 'task-123',
        title: 'Test Task'
      });
    });
  });

  describe('updateTask', () => {
    const mockUser = { id: 'user-123', role: 'doctor' };

    it('should update task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Old Title',
        createdBy: mockUser.id,
        update: jest.fn().mockResolvedValue({
          id: 'task-123',
          title: 'New Title',
          getDisplayInfo: jest.fn().mockReturnValue({
            id: 'task-123',
            title: 'New Title'
          })
        })
      };

      Task.findByPk.mockResolvedValue(mockTask);

      const updateData = { title: 'New Title' };
      const result = await updateTask('task-123', updateData, mockUser);

      expect(mockTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Title'
        })
      );
    });

    it('should throw NotFoundError when task does not exist', async () => {
      Task.findByPk.mockResolvedValue(null);

      await expect(updateTask('nonexistent', {}, mockUser))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when user cannot update task', async () => {
      const mockTask = {
        id: 'task-123',
        createdBy: 'other-user',
        assignedTo: 'another-user'
      };

      Task.findByPk.mockResolvedValue(mockTask);

      await expect(updateTask('task-123', {}, mockUser))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('updateTaskStatus', () => {
    const mockUser = { id: 'user-123', role: 'doctor' };

    it('should update status successfully', async () => {
      const mockTask = {
        id: 'task-123',
        status: 'pending',
        createdBy: mockUser.id,
        update: jest.fn().mockResolvedValue({
          id: 'task-123',
          status: 'in_progress',
          getDisplayInfo: jest.fn().mockReturnValue({
            id: 'task-123',
            status: 'in_progress'
          })
        })
      };

      Task.findByPk.mockResolvedValue(mockTask);

      const result = await updateTaskStatus('task-123', 'in_progress', mockUser);

      expect(mockTask.update).toHaveBeenCalledWith({ status: 'in_progress' });
    });

    it('should throw ValidationError for invalid status transition', async () => {
      const mockTask = {
        id: 'task-123',
        status: 'completed',
        createdBy: mockUser.id
      };

      Task.findByPk.mockResolvedValue(mockTask);

      await expect(updateTaskStatus('task-123', 'pending', mockUser))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('assignTask', () => {
    const mockUser = { id: 'user-123', role: 'doctor' };

    it('should assign task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        status: 'pending',
        createdBy: mockUser.id,
        canBeAssigned: jest.fn().mockReturnValue(true),
        update: jest.fn().mockResolvedValue({
          id: 'task-123',
          assignedTo: 'assignee-123',
          getDisplayInfo: jest.fn().mockReturnValue({
            id: 'task-123',
            assignedTo: 'assignee-123'
          })
        })
      };

      Task.findByPk.mockResolvedValue(mockTask);

      const result = await assignTask('task-123', 'assignee-123', mockUser);

      expect(mockTask.update).toHaveBeenCalledWith({ assignedTo: 'assignee-123' });
    });

    it('should throw ConflictError when task cannot be assigned', async () => {
      const mockTask = {
        id: 'task-123',
        createdBy: mockUser.id,
        canBeAssigned: jest.fn().mockReturnValue(false)
      };

      Task.findByPk.mockResolvedValue(mockTask);

      await expect(assignTask('task-123', 'assignee-123', mockUser))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('getPendingTasks', () => {
    const mockUser = { id: 'user-123', role: 'doctor' };

    it('should return pending tasks', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          status: 'pending',
          getDisplayInfo: jest.fn().mockReturnValue({ id: 'task-1', status: 'pending' })
        },
        {
          id: 'task-2',
          status: 'pending',
          getDisplayInfo: jest.fn().mockReturnValue({ id: 'task-2', status: 'pending' })
        }
      ];

      Task.findPending.mockResolvedValue(mockTasks);

      const result = await getPendingTasks({}, mockUser);

      expect(Task.findPending).toHaveBeenCalledWith({
        assignedTo: mockUser.id
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'task-1', status: 'pending' });
    });
  });

  describe('getOverdueTasks', () => {
    const mockUser = { id: 'user-123', role: 'doctor' };

    it('should return overdue tasks', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          dueDate: new Date(Date.now() - 86400000), // Yesterday
          getDisplayInfo: jest.fn().mockReturnValue({ id: 'task-1', isOverdue: true })
        }
      ];

      Task.findOverdue.mockResolvedValue(mockTasks);

      const result = await getOverdueTasks({}, mockUser);

      expect(Task.findOverdue).toHaveBeenCalledWith({
        assignedTo: mockUser.id
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'task-1', isOverdue: true });
    });
  });

  describe('getTasksDueToday', () => {
    const mockUser = { id: 'user-123', role: 'doctor' };

    it('should return tasks due today', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          dueDate: new Date(),
          getDisplayInfo: jest.fn().mockReturnValue({ id: 'task-1', isDueToday: true })
        }
      ];

      Task.findDueToday.mockResolvedValue(mockTasks);

      const result = await getTasksDueToday({}, mockUser);

      expect(Task.findDueToday).toHaveBeenCalledWith({
        assignedTo: mockUser.id
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'task-1', isDueToday: true });
    });
  });
});
