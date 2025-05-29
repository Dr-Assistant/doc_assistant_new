/**
 * Dashboard Controller Tests
 * This module tests the dashboard controller
 */

const dashboardController = require('../../../src/controllers/dashboard.controller');
const dashboardService = require('../../../src/services/dashboard.service');
const { StatusCodes } = require('http-status-codes');

// Mock the dashboard service
jest.mock('../../../src/services/dashboard.service');

describe('Dashboard Controller', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request, response, and next
    req = {
      query: {},
      user: { id: 'doctor-123' },
      headers: { authorization: 'Bearer token-123' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  describe('getTodayAppointments', () => {
    it('should return today\'s appointments', async () => {
      // Arrange
      const mockAppointments = [
        { id: '1', patient: { name: 'John Doe' }, start_time: '2023-06-01T10:00:00Z' },
        { id: '2', patient: { name: 'Jane Smith' }, start_time: '2023-06-01T11:00:00Z' }
      ];

      dashboardService.getTodayAppointments.mockResolvedValue(mockAppointments);

      // Act
      await dashboardController.getTodayAppointments(req, res, next);

      // Assert
      expect(dashboardService.getTodayAppointments).toHaveBeenCalledWith('doctor-123', 'token-123');
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAppointments
      });
    });

    it('should use doctorId from query if provided', async () => {
      // Arrange
      req.query.doctorId = 'doctor-456';
      const mockAppointments = [
        { id: '1', patient: { name: 'John Doe' }, start_time: '2023-06-01T10:00:00Z' }
      ];

      dashboardService.getTodayAppointments.mockResolvedValue(mockAppointments);

      // Act
      await dashboardController.getTodayAppointments(req, res, next);

      // Assert
      expect(dashboardService.getTodayAppointments).toHaveBeenCalledWith('doctor-456', 'token-123');
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Test error');
      dashboardService.getTodayAppointments.mockRejectedValue(error);

      // Act
      await dashboardController.getTodayAppointments(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getPendingTasks', () => {
    it('should return pending tasks', async () => {
      // Arrange
      const mockTasks = [
        { id: '1', title: 'Review lab results', patient: 'John Doe', priority: 'high' },
        { id: '2', title: 'Complete SOAP note', patient: 'Jane Smith', priority: 'medium' }
      ];

      dashboardService.getPendingTasks.mockResolvedValue(mockTasks);

      // Act
      await dashboardController.getPendingTasks(req, res, next);

      // Assert
      expect(dashboardService.getPendingTasks).toHaveBeenCalledWith('doctor-123', 'token-123');
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTasks
      });
    });
  });

  describe('getCriticalAlerts', () => {
    it('should return critical alerts', async () => {
      // Arrange
      const mockAlerts = [
        { id: '1', type: 'lab_result', patient: 'John Doe', message: 'Abnormal lab result', severity: 'critical' },
        { id: '2', type: 'medication', patient: 'Jane Smith', message: 'Potential drug interaction', severity: 'warning' }
      ];

      dashboardService.getCriticalAlerts.mockResolvedValue(mockAlerts);

      // Act
      await dashboardController.getCriticalAlerts(req, res, next);

      // Assert
      expect(dashboardService.getCriticalAlerts).toHaveBeenCalledWith('doctor-123', 'token-123');
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAlerts
      });
    });
  });

  describe('getPracticeMetrics', () => {
    it('should return practice metrics', async () => {
      // Arrange
      const mockMetrics = {
        totalAppointments: 10,
        completedAppointments: 5,
        inProgressAppointments: 1,
        waitingAppointments: 4,
        progress: 50,
        averageWaitTime: 15
      };

      dashboardService.getPracticeMetrics.mockResolvedValue(mockMetrics);

      // Act
      await dashboardController.getPracticeMetrics(req, res, next);

      // Assert
      expect(dashboardService.getPracticeMetrics).toHaveBeenCalledWith('doctor-123', 'token-123');
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockMetrics
      });
    });
  });

  describe('getDashboardData', () => {
    it('should return complete dashboard data', async () => {
      // Arrange
      const mockDashboardData = {
        appointments: [{ id: '1', patient: { name: 'John Doe' } }],
        tasks: [{ id: '1', title: 'Review lab results' }],
        alerts: [{ id: '1', type: 'lab_result', severity: 'critical' }],
        metrics: { totalAppointments: 10, progress: 50 },
        timestamp: new Date()
      };

      dashboardService.getDashboardData.mockResolvedValue(mockDashboardData);

      // Act
      await dashboardController.getDashboardData(req, res, next);

      // Assert
      expect(dashboardService.getDashboardData).toHaveBeenCalledWith('doctor-123', 'token-123');
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockDashboardData
      });
    });
  });
});
