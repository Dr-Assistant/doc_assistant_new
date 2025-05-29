/**
 * Patient Service Tests
 * This module tests the patient service
 */

const patientService = require('../../../src/services/patient.service');
const patientRepository = require('../../../src/repositories/patient.repository');
const medicalHistoryRepository = require('../../../src/repositories/medical.history.repository');
const { NotFoundError, ConflictError } = require('../../../src/utils/errors');

// Mock the repositories
jest.mock('../../../src/repositories/patient.repository');
jest.mock('../../../src/repositories/medical.history.repository');

describe('Patient Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getAllPatients', () => {
    it('should return all patients with pagination', async () => {
      // Arrange
      const mockPatients = {
        patients: [
          { id: '1', first_name: 'John', last_name: 'Doe' },
          { id: '2', first_name: 'Jane', last_name: 'Smith' }
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
      
      patientRepository.findAll.mockResolvedValue(mockPatients);
      
      // Act
      const result = await patientService.getAllPatients();
      
      // Assert
      expect(patientRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPatients);
    });

    it('should pass options to repository', async () => {
      // Arrange
      const options = {
        page: 2,
        limit: 5,
        status: 'active',
        search: 'John',
        sort: 'first_name',
        order: 'DESC'
      };
      
      patientRepository.findAll.mockResolvedValue({
        patients: [],
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
      await patientService.getAllPatients(options);
      
      // Assert
      expect(patientRepository.findAll).toHaveBeenCalledWith(options);
    });
  });

  describe('getPatientById', () => {
    it('should return a patient by ID', async () => {
      // Arrange
      const mockPatient = { id: '1', first_name: 'John', last_name: 'Doe' };
      patientRepository.findById.mockResolvedValue(mockPatient);
      
      // Act
      const result = await patientService.getPatientById('1');
      
      // Assert
      expect(patientRepository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockPatient);
    });

    it('should throw NotFoundError if patient not found', async () => {
      // Arrange
      patientRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(patientService.getPatientById('1')).rejects.toThrow(NotFoundError);
      expect(patientRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('createPatient', () => {
    it('should create a new patient', async () => {
      // Arrange
      const patientData = {
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        gender: 'male'
      };
      
      const mockPatient = { id: '1', ...patientData };
      
      patientRepository.findByField.mockResolvedValue(null);
      patientRepository.create.mockResolvedValue(mockPatient);
      medicalHistoryRepository.createOrUpdate.mockResolvedValue({});
      
      // Act
      const result = await patientService.createPatient(patientData);
      
      // Assert
      expect(patientRepository.create).toHaveBeenCalledWith(patientData);
      expect(medicalHistoryRepository.createOrUpdate).toHaveBeenCalledWith('1', {});
      expect(result).toEqual(mockPatient);
    });

    it('should throw ConflictError if MRN already exists', async () => {
      // Arrange
      const patientData = {
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        gender: 'male',
        mrn: 'MRN123'
      };
      
      patientRepository.findByField.mockResolvedValue({ id: '2' });
      
      // Act & Assert
      await expect(patientService.createPatient(patientData)).rejects.toThrow(ConflictError);
      expect(patientRepository.findByField).toHaveBeenCalledWith('mrn', 'MRN123');
    });
  });

  // Add more tests for other methods...
});
