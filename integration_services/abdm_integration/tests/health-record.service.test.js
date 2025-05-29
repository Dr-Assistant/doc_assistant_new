/**
 * Health Record Service Tests
 */

const { 
  fetchHealthRecords, 
  getFetchStatus, 
  getHealthRecords, 
  getHealthRecordDetails 
} = require('../src/services/health-record.service');
const { 
  HealthRecordFetchRequest, 
  HealthRecord, 
  HealthRecordAccessLog, 
  ConsentArtifact 
} = require('../src/models');
const { createAbdmApiClient } = require('../src/services/abdm-auth.service');
const { BadRequestError, NotFoundError, ConflictError } = require('../src/middleware/error.middleware');

// Mock dependencies
jest.mock('../src/services/abdm-auth.service');
jest.mock('../src/models');

describe('Health Record Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchHealthRecords', () => {
    const mockFetchData = {
      consentId: '123e4567-e89b-12d3-a456-426614174000',
      patientId: '456e7890-e89b-12d3-a456-426614174001',
      hiTypes: ['DiagnosticReport', 'Prescription'],
      dateRange: {
        from: '2024-01-01',
        to: '2024-12-31'
      }
    };

    const mockUser = {
      id: '789e0123-e89b-12d3-a456-426614174002',
      full_name: 'Dr. John Doe'
    };

    const mockConsentArtifact = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      abdmArtifactId: 'consent-artifact-123',
      isActive: jest.fn().mockReturnValue(true),
      artifactData: {
        permission: {
          hiTypes: ['DiagnosticReport', 'Prescription'],
          dateRange: {
            from: '2024-01-01',
            to: '2024-12-31'
          }
        }
      }
    };

    it('should successfully fetch health records', async () => {
      // Mock database operations
      ConsentArtifact.findByPk.mockResolvedValue(mockConsentArtifact);
      
      const mockFetchRequest = {
        id: '789e0123-e89b-12d3-a456-426614174002',
        abdmRequestId: 'abdm-fetch-123',
        status: 'PROCESSING',
        createdAt: new Date(),
        update: jest.fn().mockResolvedValue()
      };

      HealthRecordFetchRequest.create.mockResolvedValue(mockFetchRequest);

      // Mock ABDM API client
      const mockApiClient = {
        post: jest.fn().mockResolvedValue({
          data: {
            hiRequest: { requestId: 'abdm-fetch-123' }
          }
        })
      };
      createAbdmApiClient.mockResolvedValue(mockApiClient);

      const result = await fetchHealthRecords(mockFetchData, mockUser, '127.0.0.1', 'test-agent');

      expect(ConsentArtifact.findByPk).toHaveBeenCalledWith(mockFetchData.consentId);
      expect(mockConsentArtifact.isActive).toHaveBeenCalled();
      
      expect(HealthRecordFetchRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          consentArtifactId: mockConsentArtifact.id,
          patientId: mockFetchData.patientId,
          doctorId: mockUser.id,
          hiTypes: mockFetchData.hiTypes
        })
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v0.5/health-information/cm/request',
        expect.objectContaining({
          hiRequest: expect.objectContaining({
            consent: { id: mockConsentArtifact.abdmArtifactId }
          })
        })
      );

      expect(result).toEqual({
        id: mockFetchRequest.id,
        abdmRequestId: mockFetchRequest.abdmRequestId,
        status: mockFetchRequest.status,
        createdAt: mockFetchRequest.createdAt
      });
    });

    it('should throw NotFoundError for non-existent consent', async () => {
      ConsentArtifact.findByPk.mockResolvedValue(null);

      await expect(fetchHealthRecords(mockFetchData, mockUser, '127.0.0.1', 'test-agent'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError for inactive consent', async () => {
      const inactiveConsent = {
        ...mockConsentArtifact,
        isActive: jest.fn().mockReturnValue(false)
      };
      ConsentArtifact.findByPk.mockResolvedValue(inactiveConsent);

      await expect(fetchHealthRecords(mockFetchData, mockUser, '127.0.0.1', 'test-agent'))
        .rejects.toThrow(ConflictError);
    });

    it('should throw BadRequestError for invalid fetch data', async () => {
      const invalidData = { ...mockFetchData };
      delete invalidData.consentId;

      await expect(fetchHealthRecords(invalidData, mockUser, '127.0.0.1', 'test-agent'))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('getFetchStatus', () => {
    it('should return fetch status successfully', async () => {
      const mockFetchRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        abdmRequestId: 'abdm-fetch-123',
        status: 'COMPLETED',
        hiTypes: ['DiagnosticReport'],
        dateRangeFrom: '2024-01-01',
        dateRangeTo: '2024-12-31',
        totalRecords: 10,
        completedRecords: 8,
        failedRecords: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        healthRecords: [{ id: 'record-1' }, { id: 'record-2' }],
        getProgress: jest.fn().mockReturnValue({
          total: 10,
          completed: 8,
          failed: 2,
          percentage: 80
        })
      };

      HealthRecordFetchRequest.findByPk.mockResolvedValue(mockFetchRequest);

      const result = await getFetchStatus(mockFetchRequest.id);

      expect(HealthRecordFetchRequest.findByPk).toHaveBeenCalledWith(
        mockFetchRequest.id,
        expect.objectContaining({
          include: expect.any(Array)
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: mockFetchRequest.id,
          status: mockFetchRequest.status,
          progress: {
            total: 10,
            completed: 8,
            failed: 2,
            percentage: 80
          },
          recordCount: 2
        })
      );
    });

    it('should throw NotFoundError for non-existent fetch request', async () => {
      HealthRecordFetchRequest.findByPk.mockResolvedValue(null);

      await expect(getFetchStatus('non-existent-id'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getHealthRecords', () => {
    it('should return health records for patient', async () => {
      const mockRecords = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          recordType: 'DiagnosticReport',
          recordDate: '2024-01-15',
          source: 'ABDM',
          getDisplayInfo: jest.fn().mockReturnValue({
            id: '123e4567-e89b-12d3-a456-426614174000',
            type: 'DiagnosticReport',
            date: '2024-01-15',
            title: 'Blood Test Report',
            summary: 'Complete blood count analysis',
            source: 'ABDM'
          })
        }
      ];

      const mockRecordTypes = [
        {
          recordType: 'DiagnosticReport',
          dataValues: { count: '5' }
        }
      ];

      HealthRecord.findByPatient.mockResolvedValue(mockRecords);
      HealthRecord.getRecordTypes.mockResolvedValue(mockRecordTypes);

      const result = await getHealthRecords('patient-id', { type: 'DiagnosticReport' });

      expect(HealthRecord.findByPatient).toHaveBeenCalledWith(
        'patient-id',
        expect.objectContaining({
          recordType: 'DiagnosticReport'
        })
      );

      expect(result.records).toHaveLength(1);
      expect(result.recordTypes).toEqual([
        { type: 'DiagnosticReport', count: 5 }
      ]);
    });
  });

  describe('getHealthRecordDetails', () => {
    it('should return detailed health record', async () => {
      const mockRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        recordType: 'DiagnosticReport',
        recordDate: '2024-01-15',
        providerId: 'provider-123',
        providerName: 'Test Lab',
        providerType: 'Laboratory',
        fhirResource: { resourceType: 'DiagnosticReport' },
        source: 'ABDM',
        fetchedAt: new Date(),
        createdAt: new Date(),
        isActive: jest.fn().mockReturnValue(true),
        verifyIntegrity: jest.fn().mockReturnValue(true)
      };

      HealthRecord.findByPk.mockResolvedValue(mockRecord);
      HealthRecordAccessLog.logAccess.mockResolvedValue();

      const mockUser = { id: 'user-id' };
      const result = await getHealthRecordDetails(
        mockRecord.id,
        mockUser,
        '127.0.0.1',
        'test-agent'
      );

      expect(HealthRecord.findByPk).toHaveBeenCalledWith(mockRecord.id);
      expect(mockRecord.isActive).toHaveBeenCalled();
      expect(mockRecord.verifyIntegrity).toHaveBeenCalled();
      
      expect(HealthRecordAccessLog.logAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          healthRecordId: mockRecord.id,
          userId: mockUser.id,
          accessType: 'VIEW'
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: mockRecord.id,
          type: mockRecord.recordType,
          fhirResource: mockRecord.fhirResource
        })
      );
    });

    it('should throw NotFoundError for non-existent record', async () => {
      HealthRecord.findByPk.mockResolvedValue(null);

      await expect(getHealthRecordDetails('non-existent-id', { id: 'user-id' }))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError for inactive record', async () => {
      const mockRecord = {
        isActive: jest.fn().mockReturnValue(false)
      };
      HealthRecord.findByPk.mockResolvedValue(mockRecord);

      await expect(getHealthRecordDetails('record-id', { id: 'user-id' }))
        .rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError for integrity check failure', async () => {
      const mockRecord = {
        isActive: jest.fn().mockReturnValue(true),
        verifyIntegrity: jest.fn().mockReturnValue(false)
      };
      HealthRecord.findByPk.mockResolvedValue(mockRecord);

      await expect(getHealthRecordDetails('record-id', { id: 'user-id' }))
        .rejects.toThrow(ConflictError);
    });
  });
});
