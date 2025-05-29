/**
 * Consent Service Tests
 */

const { requestConsent, getConsentStatus, listActiveConsents, revokeConsent, handleConsentCallback } = require('../src/services/consent.service');
const { ConsentRequest, ConsentArtifact, ConsentAuditLog } = require('../src/models');
const { createAbdmApiClient } = require('../src/services/abdm-auth.service');
const { BadRequestError, NotFoundError, ConflictError } = require('../src/middleware/error.middleware');

// Mock dependencies
jest.mock('../src/services/abdm-auth.service');
jest.mock('../src/models');

describe('Consent Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestConsent', () => {
    const mockConsentData = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      patientAbhaId: 'test@abdm',
      purpose: {
        code: 'CAREMGT',
        text: 'Care Management'
      },
      hiTypes: ['DiagnosticReport', 'Prescription'],
      dateRange: {
        from: '2024-01-01',
        to: '2024-12-31'
      },
      expiry: '2025-01-01T00:00:00Z'
    };

    const mockUser = {
      id: '456e7890-e89b-12d3-a456-426614174001',
      full_name: 'Dr. John Doe'
    };

    it('should successfully request consent', async () => {
      // Mock database operations
      const mockConsentRequest = {
        id: '789e0123-e89b-12d3-a456-426614174002',
        abdmRequestId: 'abdm-request-123',
        status: 'REQUESTED',
        createdAt: new Date(),
        update: jest.fn().mockResolvedValue()
      };

      ConsentRequest.create.mockResolvedValue(mockConsentRequest);
      ConsentAuditLog.logAction.mockResolvedValue();

      // Mock ABDM API client
      const mockApiClient = {
        post: jest.fn().mockResolvedValue({
          data: {
            consent: { id: 'abdm-request-123' }
          }
        })
      };
      createAbdmApiClient.mockResolvedValue(mockApiClient);

      const result = await requestConsent(mockConsentData, mockUser, '127.0.0.1', 'test-agent');

      expect(ConsentRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: mockConsentData.patientId,
          doctorId: mockUser.id,
          purposeCode: mockConsentData.purpose.code,
          purposeText: mockConsentData.purpose.text
        })
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v0.5/consent-requests/init',
        expect.objectContaining({
          consent: expect.objectContaining({
            purpose: mockConsentData.purpose,
            hiTypes: mockConsentData.hiTypes
          })
        })
      );

      expect(ConsentAuditLog.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CONSENT_REQUESTED',
          actorId: mockUser.id,
          actorType: 'doctor'
        })
      );

      expect(result).toEqual({
        id: mockConsentRequest.id,
        abdmRequestId: mockConsentRequest.abdmRequestId,
        status: mockConsentRequest.status,
        createdAt: mockConsentRequest.createdAt
      });
    });

    it('should throw BadRequestError for invalid consent data', async () => {
      const invalidData = { ...mockConsentData };
      delete invalidData.purpose;

      await expect(requestConsent(invalidData, mockUser, '127.0.0.1', 'test-agent'))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError for invalid date range', async () => {
      const invalidData = {
        ...mockConsentData,
        dateRange: {
          from: '2024-12-31',
          to: '2024-01-01'
        }
      };

      await expect(requestConsent(invalidData, mockUser, '127.0.0.1', 'test-agent'))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError for past expiry date', async () => {
      const invalidData = {
        ...mockConsentData,
        expiry: '2020-01-01T00:00:00Z'
      };

      await expect(requestConsent(invalidData, mockUser, '127.0.0.1', 'test-agent'))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('getConsentStatus', () => {
    it('should return consent status successfully', async () => {
      const mockConsentRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        abdmRequestId: 'abdm-request-123',
        status: 'GRANTED',
        purposeCode: 'CAREMGT',
        purposeText: 'Care Management',
        hiTypes: ['DiagnosticReport'],
        dateRangeFrom: '2024-01-01',
        dateRangeTo: '2024-12-31',
        expiry: '2025-01-01T00:00:00Z',
        createdAt: new Date(),
        updatedAt: new Date(),
        artifacts: []
      };

      ConsentRequest.findByPk.mockResolvedValue(mockConsentRequest);

      const result = await getConsentStatus(mockConsentRequest.id);

      expect(ConsentRequest.findByPk).toHaveBeenCalledWith(
        mockConsentRequest.id,
        expect.objectContaining({
          include: expect.any(Array)
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: mockConsentRequest.id,
          status: mockConsentRequest.status,
          purpose: {
            code: mockConsentRequest.purposeCode,
            text: mockConsentRequest.purposeText
          }
        })
      );
    });

    it('should throw NotFoundError for non-existent consent', async () => {
      ConsentRequest.findByPk.mockResolvedValue(null);

      await expect(getConsentStatus('non-existent-id'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('listActiveConsents', () => {
    it('should return active consents for patient', async () => {
      const mockConsents = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          abdmRequestId: 'abdm-request-123',
          status: 'GRANTED',
          purposeCode: 'CAREMGT',
          purposeText: 'Care Management',
          hiTypes: ['DiagnosticReport'],
          dateRangeFrom: '2024-01-01',
          dateRangeTo: '2024-12-31',
          expiry: '2025-01-01T00:00:00Z',
          createdAt: new Date()
        }
      ];

      ConsentRequest.findActiveByPatient.mockResolvedValue(mockConsents);

      const result = await listActiveConsents('patient-id');

      expect(ConsentRequest.findActiveByPatient).toHaveBeenCalledWith('patient-id');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: mockConsents[0].id,
          status: mockConsents[0].status
        })
      );
    });
  });

  describe('revokeConsent', () => {
    it('should successfully revoke consent', async () => {
      const mockConsentRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        canBeRevoked: jest.fn().mockReturnValue(true),
        update: jest.fn().mockResolvedValue(),
        artifacts: [
          {
            revoke: jest.fn().mockResolvedValue()
          }
        ]
      };

      ConsentRequest.findByPk.mockResolvedValue(mockConsentRequest);
      ConsentAuditLog.logAction.mockResolvedValue();

      const mockUser = { id: 'user-id' };
      const result = await revokeConsent(
        mockConsentRequest.id,
        'Patient request',
        mockUser,
        '127.0.0.1',
        'test-agent'
      );

      expect(mockConsentRequest.update).toHaveBeenCalledWith({ status: 'REVOKED' });
      expect(mockConsentRequest.artifacts[0].revoke).toHaveBeenCalledWith('Patient request');
      expect(ConsentAuditLog.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CONSENT_REVOKED',
          actorId: mockUser.id
        })
      );
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundError for non-existent consent', async () => {
      ConsentRequest.findByPk.mockResolvedValue(null);

      await expect(revokeConsent('non-existent-id', 'reason', { id: 'user-id' }))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError for non-revokable consent', async () => {
      const mockConsentRequest = {
        canBeRevoked: jest.fn().mockReturnValue(false)
      };

      ConsentRequest.findByPk.mockResolvedValue(mockConsentRequest);

      await expect(revokeConsent('consent-id', 'reason', { id: 'user-id' }))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('handleConsentCallback', () => {
    it('should handle GRANTED consent callback', async () => {
      const mockConsentRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        update: jest.fn().mockResolvedValue()
      };

      const callbackData = {
        consentRequestId: 'abdm-request-123',
        status: 'GRANTED',
        consentArtefact: {
          id: 'artifact-123',
          permission: {
            dataEraseAt: '2025-01-01T00:00:00Z'
          }
        }
      };

      ConsentRequest.findByAbdmRequestId.mockResolvedValue(mockConsentRequest);
      ConsentArtifact.create.mockResolvedValue();
      ConsentAuditLog.logAction.mockResolvedValue();

      const result = await handleConsentCallback(callbackData);

      expect(mockConsentRequest.update).toHaveBeenCalledWith({ status: 'GRANTED' });
      expect(ConsentArtifact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          consentRequestId: mockConsentRequest.id,
          abdmArtifactId: callbackData.consentArtefact.id,
          status: 'ACTIVE'
        })
      );
      expect(result.success).toBe(true);
    });

    it('should handle callback for unknown consent request', async () => {
      ConsentRequest.findByAbdmRequestId.mockResolvedValue(null);

      const callbackData = {
        consentRequestId: 'unknown-request',
        status: 'GRANTED'
      };

      const result = await handleConsentCallback(callbackData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Consent request not found');
    });
  });
});
