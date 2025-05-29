/**
 * Appointment Service Tests
 * This module tests the appointment service
 */

const appointmentService = require('../../../src/services/appointment.service');
const appointmentRepository = require('../../../src/repositories/appointment.repository');
const { NotFoundError, ScheduleConflictError, BadRequestError } = require('../../../src/utils/errors');
const axios = require('axios');

// Mock the repository and axios
jest.mock('../../../src/repositories/appointment.repository');
jest.mock('axios');

describe('Appointment Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getAllAppointments', () => {
    it('should return all appointments with pagination', async () => {
      // Arrange
      const mockAppointments = {
        appointments: [
          { id: '1', doctor_id: 'doctor1', patient_id: 'patient1', start_time: '2023-06-01T10:00:00Z' },
          { id: '2', doctor_id: 'doctor1', patient_id: 'patient2', start_time: '2023-06-01T11:00:00Z' }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
      
      appointmentRepository.findAll.mockResolvedValue(mockAppointments);
      
      // Act
      const result = await appointmentService.getAllAppointments();
      
      // Assert
      expect(appointmentRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAppointments);
    });

    it('should pass options to repository', async () => {
      // Arrange
      const options = {
        page: 2,
        limit: 5,
        doctorId: 'doctor1',
        patientId: 'patient1',
        status: 'scheduled',
        type: 'in_person',
        startDate: '2023-06-01',
        endDate: '2023-06-30',
        sort: 'start_time',
        order: 'DESC'
      };
      
      appointmentRepository.findAll.mockResolvedValue({
        appointments: [],
        pagination: {
          total: 0,
          page: 2,
          limit: 5,
          totalPages: 0,
          hasNext: false,
          hasPrev: true
        }
      });
      
      // Act
      await appointmentService.getAllAppointments(options);
      
      // Assert
      expect(appointmentRepository.findAll).toHaveBeenCalledWith(options);
    });
  });

  describe('getAppointmentById', () => {
    it('should return an appointment by ID', async () => {
      // Arrange
      const mockAppointment = { id: '1', doctor_id: 'doctor1', patient_id: 'patient1', start_time: '2023-06-01T10:00:00Z' };
      appointmentRepository.findById.mockResolvedValue(mockAppointment);
      
      // Act
      const result = await appointmentService.getAppointmentById('1');
      
      // Assert
      expect(appointmentRepository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockAppointment);
    });

    it('should throw NotFoundError if appointment not found', async () => {
      // Arrange
      appointmentRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(appointmentService.getAppointmentById('1')).rejects.toThrow(NotFoundError);
      expect(appointmentRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('createAppointment', () => {
    it('should create a new appointment', async () => {
      // Arrange
      const appointmentData = {
        doctor_id: 'doctor1',
        patient_id: 'patient1',
        start_time: '2023-06-01T10:00:00Z',
        end_time: '2023-06-01T10:30:00Z',
        appointment_type: 'in_person'
      };
      
      const mockAppointment = { id: '1', ...appointmentData };
      
      // Mock doctor and patient validation
      axios.get.mockImplementation((url) => {
        if (url.includes('users')) {
          return Promise.resolve({ data: { success: true, data: { id: 'doctor1' } } });
        } else {
          return Promise.resolve({ data: { success: true, data: { id: 'patient1' } } });
        }
      });
      
      appointmentRepository.checkConflicts.mockResolvedValue([]);
      appointmentRepository.create.mockResolvedValue(mockAppointment);
      
      // Act
      const result = await appointmentService.createAppointment(appointmentData);
      
      // Assert
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(appointmentRepository.checkConflicts).toHaveBeenCalledWith(
        appointmentData.start_time,
        appointmentData.end_time,
        appointmentData.doctor_id
      );
      expect(appointmentRepository.create).toHaveBeenCalledWith(appointmentData);
      expect(result).toEqual(mockAppointment);
    });

    it('should throw ScheduleConflictError if there are conflicts', async () => {
      // Arrange
      const appointmentData = {
        doctor_id: 'doctor1',
        patient_id: 'patient1',
        start_time: '2023-06-01T10:00:00Z',
        end_time: '2023-06-01T10:30:00Z',
        appointment_type: 'in_person'
      };
      
      // Mock doctor and patient validation
      axios.get.mockImplementation((url) => {
        if (url.includes('users')) {
          return Promise.resolve({ data: { success: true, data: { id: 'doctor1' } } });
        } else {
          return Promise.resolve({ data: { success: true, data: { id: 'patient1' } } });
        }
      });
      
      const conflicts = [
        { id: 'existing1', start_time: '2023-06-01T09:45:00Z', end_time: '2023-06-01T10:15:00Z' }
      ];
      
      appointmentRepository.checkConflicts.mockResolvedValue(conflicts);
      
      // Act & Assert
      await expect(appointmentService.createAppointment(appointmentData)).rejects.toThrow(ScheduleConflictError);
      expect(appointmentRepository.checkConflicts).toHaveBeenCalledWith(
        appointmentData.start_time,
        appointmentData.end_time,
        appointmentData.doctor_id
      );
      expect(appointmentRepository.create).not.toHaveBeenCalled();
    });
  });

  // Add more tests for other methods...
});
