/**
 * Doctor Availability Service Tests
 * This module tests the doctor availability service
 */

const availabilityService = require('../../../src/services/availability.service');
const availabilityRepository = require('../../../src/repositories/availability.repository');
const { NotFoundError, ConflictError, BadRequestError } = require('../../../src/utils/errors');
const axios = require('axios');

// Mock the repository and axios
jest.mock('../../../src/repositories/availability.repository');
jest.mock('axios');

describe('Doctor Availability Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getDoctorAvailabilities', () => {
    it('should return all availabilities for a doctor', async () => {
      // Arrange
      const doctorId = 'doctor1';
      const mockAvailabilities = [
        { id: '1', doctor_id: doctorId, day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' },
        { id: '2', doctor_id: doctorId, day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00' }
      ];
      
      // Mock doctor validation
      axios.get.mockResolvedValue({ data: { success: true, data: { id: doctorId } } });
      
      availabilityRepository.findByDoctor.mockResolvedValue(mockAvailabilities);
      
      // Act
      const result = await availabilityService.getDoctorAvailabilities(doctorId);
      
      // Assert
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(availabilityRepository.findByDoctor).toHaveBeenCalledWith(doctorId, {});
      expect(result).toEqual(mockAvailabilities);
    });

    it('should pass options to repository', async () => {
      // Arrange
      const doctorId = 'doctor1';
      const options = {
        isAvailable: false,
        dayOfWeek: 1,
        sort: 'start_time',
        order: 'DESC'
      };
      
      // Mock doctor validation
      axios.get.mockResolvedValue({ data: { success: true, data: { id: doctorId } } });
      
      availabilityRepository.findByDoctor.mockResolvedValue([]);
      
      // Act
      await availabilityService.getDoctorAvailabilities(doctorId, options);
      
      // Assert
      expect(availabilityRepository.findByDoctor).toHaveBeenCalledWith(doctorId, options);
    });

    it('should throw BadRequestError if doctor not found', async () => {
      // Arrange
      const doctorId = 'nonexistent';
      
      // Mock doctor validation failure
      axios.get.mockRejectedValue({ response: { status: 404 } });
      
      // Act & Assert
      await expect(availabilityService.getDoctorAvailabilities(doctorId)).rejects.toThrow(BadRequestError);
      expect(availabilityRepository.findByDoctor).not.toHaveBeenCalled();
    });
  });

  describe('getAvailabilityById', () => {
    it('should return an availability by ID', async () => {
      // Arrange
      const mockAvailability = { id: '1', doctor_id: 'doctor1', day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' };
      availabilityRepository.findById.mockResolvedValue(mockAvailability);
      
      // Act
      const result = await availabilityService.getAvailabilityById('1');
      
      // Assert
      expect(availabilityRepository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockAvailability);
    });

    it('should throw NotFoundError if availability not found', async () => {
      // Arrange
      availabilityRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(availabilityService.getAvailabilityById('1')).rejects.toThrow(NotFoundError);
      expect(availabilityRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('createAvailability', () => {
    it('should create a new availability', async () => {
      // Arrange
      const availabilityData = {
        doctor_id: 'doctor1',
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '17:00:00'
      };
      
      const mockAvailability = { id: '1', ...availabilityData };
      
      // Mock doctor validation
      axios.get.mockResolvedValue({ data: { success: true, data: { id: 'doctor1' } } });
      
      availabilityRepository.checkConflicts.mockResolvedValue([]);
      availabilityRepository.create.mockResolvedValue(mockAvailability);
      
      // Act
      const result = await availabilityService.createAvailability(availabilityData);
      
      // Assert
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(availabilityRepository.checkConflicts).toHaveBeenCalledWith(availabilityData);
      expect(availabilityRepository.create).toHaveBeenCalledWith(availabilityData);
      expect(result).toEqual(mockAvailability);
    });

    it('should throw ConflictError if there are conflicts', async () => {
      // Arrange
      const availabilityData = {
        doctor_id: 'doctor1',
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '17:00:00'
      };
      
      // Mock doctor validation
      axios.get.mockResolvedValue({ data: { success: true, data: { id: 'doctor1' } } });
      
      const conflicts = [
        { id: 'existing1', start_time: '08:00:00', end_time: '10:00:00' }
      ];
      
      availabilityRepository.checkConflicts.mockResolvedValue(conflicts);
      
      // Act & Assert
      await expect(availabilityService.createAvailability(availabilityData)).rejects.toThrow(ConflictError);
      expect(availabilityRepository.checkConflicts).toHaveBeenCalledWith(availabilityData);
      expect(availabilityRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError for invalid time format', async () => {
      // Arrange
      const availabilityData = {
        doctor_id: 'doctor1',
        day_of_week: 1,
        start_time: '9:00', // Invalid format
        end_time: '17:00:00'
      };
      
      // Mock doctor validation
      axios.get.mockResolvedValue({ data: { success: true, data: { id: 'doctor1' } } });
      
      // Act & Assert
      await expect(availabilityService.createAvailability(availabilityData)).rejects.toThrow(BadRequestError);
      expect(availabilityRepository.checkConflicts).not.toHaveBeenCalled();
      expect(availabilityRepository.create).not.toHaveBeenCalled();
    });
  });

  // Add more tests for other methods...
});
