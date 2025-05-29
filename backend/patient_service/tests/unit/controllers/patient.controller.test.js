/**
 * Patient Controller Tests
 * This module tests the patient controller
 */

const { StatusCodes } = require('http-status-codes');
const patientController = require('../../../src/controllers/patient.controller');
const patientService = require('../../../src/services/patient.service');
const { NotFoundError } = require('../../../src/utils/errors');

// Mock the service
jest.mock('../../../src/services/patient.service');

describe('Patient Controller', () => {
  let req, res, next;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup request, response, and next function
    req = {
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
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
      
      patientService.getAllPatients.mockResolvedValue(mockPatients);
      
      // Act
      await patientController.getAllPatients(req, res, next);
      
      // Assert
      expect(patientService.getAllPatients).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPatients
      });
    });

    it('should pass query parameters to service', async () => {
      // Arrange
      req.query = {
        page: '2',
        limit: '5',
        status: 'active',
        search: 'John',
        sort: 'first_name',
        order: 'DESC'
      };
      
      patientService.getAllPatients.mockResolvedValue({
        patients: [],
        pagination: {}
      });
      
      // Act
      await patientController.getAllPatients(req, res, next);
      
      // Assert
      expect(patientService.getAllPatients).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        status: 'active',
        search: 'John',
        sort: 'first_name',
        order: 'DESC'
      });
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      const error = new Error('Service error');
      patientService.getAllPatients.mockRejectedValue(error);
      
      // Act
      await patientController.getAllPatients(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getPatientById', () => {
    it('should return a patient by ID', async () => {
      // Arrange
      req.params.id = '1';
      const mockPatient = { id: '1', first_name: 'John', last_name: 'Doe' };
      patientService.getPatientById.mockResolvedValue(mockPatient);
      
      // Act
      await patientController.getPatientById(req, res, next);
      
      // Assert
      expect(patientService.getPatientById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPatient
      });
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      req.params.id = '1';
      const error = new NotFoundError('Patient not found');
      patientService.getPatientById.mockRejectedValue(error);
      
      // Act
      await patientController.getPatientById(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  // Add more tests for other methods...
});
