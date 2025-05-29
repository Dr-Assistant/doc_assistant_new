/**
 * Dashboard Service Tests
 * This module tests the dashboard service
 */

const dashboardService = require('../../../src/services/dashboard.service');
const integrationService = require('../../../src/services/integration.service');
const cacheService = require('../../../src/services/cache.service');

// Mock the integration service and cache service
jest.mock('../../../src/services/integration.service');
jest.mock('../../../src/services/cache.service');

describe('Dashboard Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getTodayAppointments', () => {
    it('should return appointments from cache if available', async () => {
      // Arrange
      const doctorId = 'doctor-123';
      const token = 'token-123';
      const mockAppointments = [
        { id: '1', patient_id: 'patient-1', start_time: '2023-06-01T10:00:00Z' },
        { id: '2', patient_id: 'patient-2', start_time: '2023-06-01T11:00:00Z' }
      ];
      
      cacheService.get.mockResolvedValue(mockAppointments);
      
      // Act
      const result = await dashboardService.getTodayAppointments(doctorId, token);
      
      // Assert
      expect(cacheService.get).toHaveBeenCalledWith(`dashboard:appointments:today:${doctorId}`);
      expect(integrationService.getTodayAppointments).not.toHaveBeenCalled();
      expect(result).toEqual(mockAppointments);
    });

    it('should fetch appointments from integration service if not in cache', async () => {
      // Arrange
      const doctorId = 'doctor-123';
      const token = 'token-123';
      const mockAppointments = [
        { id: '1', patient_id: 'patient-1', start_time: '2023-06-01T10:00:00Z' },
        { id: '2', patient_id: 'patient-2', start_time: '2023-06-01T11:00:00Z' }
      ];
      const mockPatient1 = { id: 'patient-1', first_name: 'John', last_name: 'Doe', date_of_birth: '1990-01-01', gender: 'male' };
      const mockPatient2 = { id: 'patient-2', first_name: 'Jane', last_name: 'Smith', date_of_birth: '1985-05-15', gender: 'female' };
      
      cacheService.get.mockResolvedValue(null);
      integrationService.getTodayAppointments.mockResolvedValue(mockAppointments);
      integrationService.getPatientSummary.mockImplementation((patientId) => {
        if (patientId === 'patient-1') {
          return Promise.resolve(mockPatient1);
        } else if (patientId === 'patient-2') {
          return Promise.resolve(mockPatient2);
        }
        return Promise.reject(new Error('Patient not found'));
      });
      
      // Act
      const result = await dashboardService.getTodayAppointments(doctorId, token);
      
      // Assert
      expect(cacheService.get).toHaveBeenCalledWith(`dashboard:appointments:today:${doctorId}`);
      expect(integrationService.getTodayAppointments).toHaveBeenCalledWith(doctorId, token);
      expect(integrationService.getPatientSummary).toHaveBeenCalledTimes(2);
      expect(cacheService.set).toHaveBeenCalled();
      
      // Check that appointments are enriched with patient data
      expect(result.length).toBe(2);
      expect(result[0].patient).toBeDefined();
      expect(result[0].patient.name).toBe('John Doe');
      expect(result[1].patient).toBeDefined();
      expect(result[1].patient.name).toBe('Jane Smith');
    });
  });

  describe('getPendingTasks', () => {
    it('should return tasks from cache if available', async () => {
      // Arrange
      const doctorId = 'doctor-123';
      const token = 'token-123';
      const mockTasks = [
        { id: '1', title: 'Review lab results', patient: 'John Doe', priority: 'high' },
        { id: '2', title: 'Complete SOAP note', patient: 'Jane Smith', priority: 'medium' }
      ];
      
      cacheService.get.mockResolvedValue(mockTasks);
      
      // Act
      const result = await dashboardService.getPendingTasks(doctorId, token);
      
      // Assert
      expect(cacheService.get).toHaveBeenCalledWith(`dashboard:tasks:pending:${doctorId}`);
      expect(integrationService.getPendingTasks).not.toHaveBeenCalled();
      expect(result).toEqual(mockTasks);
    });

    it('should fetch tasks from integration service if not in cache', async () => {
      // Arrange
      const doctorId = 'doctor-123';
      const token = 'token-123';
      const mockTasks = [
        { id: '1', title: 'Review lab results', patient: 'John Doe', priority: 'high' },
        { id: '2', title: 'Complete SOAP note', patient: 'Jane Smith', priority: 'medium' }
      ];
      
      cacheService.get.mockResolvedValue(null);
      integrationService.getPendingTasks.mockResolvedValue(mockTasks);
      
      // Act
      const result = await dashboardService.getPendingTasks(doctorId, token);
      
      // Assert
      expect(cacheService.get).toHaveBeenCalledWith(`dashboard:tasks:pending:${doctorId}`);
      expect(integrationService.getPendingTasks).toHaveBeenCalledWith(doctorId, token);
      expect(cacheService.set).toHaveBeenCalled();
      expect(result).toEqual(mockTasks);
    });
  });

  // Add more tests for other methods...
});
