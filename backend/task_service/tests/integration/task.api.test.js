/**
 * Task API Integration Tests
 */

const request = require('supertest');
const app = require('../../src/server');
const { Task } = require('../../src/models');

// Mock the models and auth middleware
jest.mock('../../src/models');
jest.mock('../../src/middleware/auth.middleware', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 'user-123', role: 'doctor' };
    next();
  }
}));

describe('Task API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/tasks', () => {
    const validTaskData = {
      title: 'Test Task',
      description: 'Test Description',
      taskType: 'documentation',
      priority: 'medium',
      dueDate: new Date(Date.now() + 86400000).toISOString()
    };

    it('should create a task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        ...validTaskData,
        createdBy: 'user-123',
        status: 'pending',
        getDisplayInfo: jest.fn().mockReturnValue({
          id: 'task-123',
          title: 'Test Task',
          status: 'pending'
        })
      };

      Task.create.mockResolvedValue(mockTask);

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer mock-token')
        .send(validTaskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Task');
      expect(response.body.message).toBe('Task created successfully');
    });

    it('should return 400 for missing title', async () => {
      const invalidData = { ...validTaskData };
      delete invalidData.title;

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer mock-token')
        .send(invalidData);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing taskType', async () => {
      const invalidData = { ...validTaskData };
      delete invalidData.taskType;

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer mock-token')
        .send(invalidData);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid priority', async () => {
      const invalidData = {
        ...validTaskData,
        priority: 'invalid'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer mock-token')
        .send(invalidData);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid taskType', async () => {
      const invalidData = {
        ...validTaskData,
        taskType: 'invalid'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer mock-token')
        .send(invalidData);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for missing authorization', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send(validTaskData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return task by ID', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        createdBy: 'user-123',
        getDisplayInfo: jest.fn().mockReturnValue({
          id: 'task-123',
          title: 'Test Task'
        })
      };

      Task.findByPk.mockResolvedValue(mockTask);

      const response = await request(app)
        .get('/api/tasks/task-123')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('task-123');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid-uuid')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    it('should return tasks with pagination', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          getDisplayInfo: jest.fn().mockReturnValue({ id: 'task-1', title: 'Task 1' })
        },
        {
          id: 'task-2',
          title: 'Task 2',
          getDisplayInfo: jest.fn().mockReturnValue({ id: 'task-2', title: 'Task 2' })
        }
      ];

      Task.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockTasks
      });

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter tasks by status', async () => {
      Task.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{
          id: 'task-1',
          status: 'pending',
          getDisplayInfo: jest.fn().mockReturnValue({ id: 'task-1', status: 'pending' })
        }]
      });

      const response = await request(app)
        .get('/api/tasks?status=pending')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid status filter', async () => {
      const response = await request(app)
        .get('/api/tasks?status=invalid')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Old Title',
        createdBy: 'user-123',
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

      const response = await request(app)
        .put('/api/tasks/task-123')
        .set('Authorization', 'Bearer mock-token')
        .send({ title: 'New Title' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task updated successfully');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .put('/api/tasks/invalid-uuid')
        .set('Authorization', 'Bearer mock-token')
        .send({ title: 'New Title' });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        createdBy: 'user-123',
        destroy: jest.fn().mockResolvedValue()
      };

      Task.findByPk.mockResolvedValue(mockTask);

      const response = await request(app)
        .delete('/api/tasks/task-123')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    it('should update task status successfully', async () => {
      const mockTask = {
        id: 'task-123',
        status: 'pending',
        createdBy: 'user-123',
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

      const response = await request(app)
        .patch('/api/tasks/task-123/status')
        .set('Authorization', 'Bearer mock-token')
        .send({ status: 'in_progress' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task status updated successfully');
    });

    it('should return 400 for missing status', async () => {
      const response = await request(app)
        .patch('/api/tasks/task-123/status')
        .set('Authorization', 'Bearer mock-token')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch('/api/tasks/task-123/status')
        .set('Authorization', 'Bearer mock-token')
        .send({ status: 'invalid' });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/tasks/:id/assign', () => {
    it('should assign task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        status: 'pending',
        createdBy: 'user-123',
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

      const response = await request(app)
        .patch('/api/tasks/task-123/assign')
        .set('Authorization', 'Bearer mock-token')
        .send({ assignedTo: 'assignee-123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task assigned successfully');
    });

    it('should return 400 for missing assignedTo', async () => {
      const response = await request(app)
        .patch('/api/tasks/task-123/assign')
        .set('Authorization', 'Bearer mock-token')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks/pending', () => {
    it('should return pending tasks', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          status: 'pending',
          getDisplayInfo: jest.fn().mockReturnValue({ id: 'task-1', status: 'pending' })
        }
      ];

      Task.findPending.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/tasks/pending')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/tasks/overdue', () => {
    it('should return overdue tasks', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          dueDate: new Date(Date.now() - 86400000),
          getDisplayInfo: jest.fn().mockReturnValue({ id: 'task-1', isOverdue: true })
        }
      ];

      Task.findOverdue.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/tasks/overdue')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/tasks/due-today', () => {
    it('should return tasks due today', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          dueDate: new Date(),
          getDisplayInfo: jest.fn().mockReturnValue({ id: 'task-1', isDueToday: true })
        }
      ];

      Task.findDueToday.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/tasks/due-today')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });
});
