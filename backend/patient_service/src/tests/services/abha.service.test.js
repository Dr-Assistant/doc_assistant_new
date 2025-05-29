/**
 * ABHA Service Tests
 */

const axios = require('axios');
const abhaService = require('../../services/abha.service');
const { ValidationError } = require('../../utils/errors');

// Mock axios
jest.mock('axios');

describe('ABHA Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.ABDM_BASE_URL = 'https://test.abdm.gov.in/gateway';
    process.env.ABDM_CLIENT_ID = 'test_client_id';
    process.env.ABDM_CLIENT_SECRET = 'test_client_secret';
    process.env.ABDM_AUTH_URL = 'https://test.abdm.gov.in/gateway/v0.5/sessions';
    process.env.CONSENT_CALLBACK_URL = 'http://localhost:8003/api/patients/abha/consent/callback';
    process.env.HEALTH_RECORD_CALLBACK_URL = 'http://localhost:8003/api/patients/abha/health-records/callback';
  });

  describe('generateSessionToken', () => {
    it('should generate a session token successfully', async () => {
      const mockToken = 'test_token';
      axios.post.mockResolvedValueOnce({ data: { access_token: mockToken } });

      const token = await abhaService.generateSessionToken();
      expect(token).toBe(mockToken);
      expect(axios.post).toHaveBeenCalledWith(
        process.env.ABDM_AUTH_URL,
        {
          clientId: process.env.ABDM_CLIENT_ID,
          clientSecret: process.env.ABDM_CLIENT_SECRET,
          grantType: 'client_credentials'
        }
      );
    });

    it('should throw an error when token generation fails', async () => {
      axios.post.mockRejectedValueOnce(new Error('Auth failed'));

      await expect(abhaService.generateSessionToken()).rejects.toThrow('Failed to authenticate with ABHA gateway');
    });
  });

  describe('verifyABHAId', () => {
    it('should verify ABHA ID successfully', async () => {
      const mockToken = 'test_token';
      const mockAbhaId = 'test-abha-id';
      const mockResponse = {
        data: {
          valid: true,
          details: { name: 'Test Patient' }
        }
      };

      axios.post.mockResolvedValueOnce({ data: { access_token: mockToken } });
      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await abhaService.verifyABHAId(mockAbhaId);
      expect(result).toEqual({
        isValid: true,
        details: { name: 'Test Patient' }
      });
    });

    it('should handle verification failure', async () => {
      const mockAbhaId = 'invalid-abha-id';
      axios.post.mockResolvedValueOnce({ data: { access_token: 'test_token' } });
      axios.get.mockRejectedValueOnce(new Error('Verification failed'));

      await expect(abhaService.verifyABHAId(mockAbhaId)).rejects.toThrow('Failed to verify ABHA ID');
    });
  });

  describe('createConsentRequest', () => {
    it('should create consent request successfully', async () => {
      const mockToken = 'test_token';
      const mockPatientId = 'test-patient-id';
      const mockAbhaId = 'test-abha-id';
      const mockPurpose = { type: 'treatment' };
      const mockResponse = {
        data: {
          consentId: 'test-consent-id',
          status: 'PENDING'
        }
      };

      axios.post.mockResolvedValueOnce({ data: { access_token: mockToken } });
      axios.post.mockResolvedValueOnce(mockResponse);

      const result = await abhaService.createConsentRequest(mockPatientId, mockAbhaId, mockPurpose);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle consent request failure', async () => {
      const mockPatientId = 'test-patient-id';
      const mockAbhaId = 'test-abha-id';
      const mockPurpose = { type: 'treatment' };

      axios.post.mockResolvedValueOnce({ data: { access_token: 'test_token' } });
      axios.post.mockRejectedValueOnce(new Error('Consent request failed'));

      await expect(abhaService.createConsentRequest(mockPatientId, mockAbhaId, mockPurpose))
        .rejects.toThrow('Failed to create consent request');
    });
  });

  describe('handleConsentCallback', () => {
    it('should handle granted consent successfully', async () => {
      const mockConsentId = 'test-consent-id';
      const mockHealthRecords = { records: [] };
      
      axios.post.mockResolvedValueOnce({ data: { access_token: 'test_token' } });
      axios.get.mockResolvedValueOnce({ data: mockHealthRecords });

      const result = await abhaService.handleConsentCallback({
        consentId: mockConsentId,
        status: 'GRANTED'
      });

      expect(result).toEqual(mockHealthRecords);
    });

    it('should handle denied consent', async () => {
      const mockError = 'Consent denied by user';
      
      await expect(abhaService.handleConsentCallback({
        consentId: 'test-consent-id',
        status: 'DENIED',
        error: mockError
      })).rejects.toThrow(mockError);
    });
  });

  describe('handleHealthRecordCallback', () => {
    it('should handle health record callback successfully', async () => {
      const mockCallbackData = {
        patientId: 'test-patient-id',
        records: [{ type: 'prescription' }]
      };

      const result = await abhaService.handleHealthRecordCallback(mockCallbackData);
      expect(result).toEqual({
        ...mockCallbackData,
        timestamp: expect.any(Date)
      });
    });

    it('should handle health record callback error', async () => {
      const mockError = 'Failed to process health records';
      
      await expect(abhaService.handleHealthRecordCallback({
        patientId: 'test-patient-id',
        error: mockError
      })).rejects.toThrow(mockError);
    });
  });
}); 