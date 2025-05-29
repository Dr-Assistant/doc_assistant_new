/**
 * Consent API Integration Tests
 */

const request = require('supertest');
const app = require('../src/server');
const { ConsentRequest, ConsentArtifact } = require('../src/models');

// Mock the models
jest.mock('../src/models');
jest.mock('../src/services/abdm-auth.service');

describe('Consent API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/abdm/consent/request', () => {
    const validConsentData = {
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

    it('should create consent request successfully', async () => {
      // Mock authentication
      const mockUser = { id: 'user-id', full_name: 'Dr. Test' };
      
      // Mock the auth middleware to return a user
      jest.doMock('../src/middleware/auth.middleware', () => ({
        verifyToken: (req, res, next) => {
          req.user = mockUser;
          next();
        }
      }));

      const response = await request(app)
        .post('/api/abdm/consent/request')
        .set('Authorization', 'Bearer mock-token')
        .send(validConsentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Consent request submitted successfully');
    });

    it('should return 400 for invalid patient ID', async () => {
      const invalidData = { ...validConsentData, patientId: 'invalid-uuid' };

      const response = await request(app)
        .post('/api/abdm/consent/request')
        .set('Authorization', 'Bearer mock-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing purpose', async () => {
      const invalidData = { ...validConsentData };
      delete invalidData.purpose;

      const response = await request(app)
        .post('/api/abdm/consent/request')
        .set('Authorization', 'Bearer mock-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for empty hiTypes array', async () => {
      const invalidData = { ...validConsentData, hiTypes: [] };

      const response = await request(app)
        .post('/api/abdm/consent/request')
        .set('Authorization', 'Bearer mock-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid hiTypes', async () => {
      const invalidData = { ...validConsentData, hiTypes: ['InvalidType'] };

      const response = await request(app)
        .post('/api/abdm/consent/request')
        .set('Authorization', 'Bearer mock-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for missing authorization', async () => {
      const response = await request(app)
        .post('/api/abdm/consent/request')
        .send(validConsentData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/abdm/consent/:consentRequestId/status', () => {
    it('should return consent status successfully', async () => {
      const consentId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Mock the consent service response
      const mockConsentStatus = {
        id: consentId,
        status: 'GRANTED',
        purpose: { code: 'CAREMGT', text: 'Care Management' }
      };

      // Mock authentication
      jest.doMock('../src/middleware/auth.middleware', () => ({
        verifyToken: (req, res, next) => {
          req.user = { id: 'user-id' };
          next();
        }
      }));

      const response = await request(app)
        .get(`/api/abdm/consent/${consentId}/status`)
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid consent ID format', async () => {
      const response = await request(app)
        .get('/api/abdm/consent/invalid-uuid/status')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/abdm/consent/active', () => {
    it('should return active consents for patient', async () => {
      const patientId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock authentication
      jest.doMock('../src/middleware/auth.middleware', () => ({
        verifyToken: (req, res, next) => {
          req.user = { id: 'user-id' };
          next();
        }
      }));

      const response = await request(app)
        .get(`/api/abdm/consent/active?patientId=${patientId}`)
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('consents');
    });

    it('should return 400 for missing patient ID', async () => {
      const response = await request(app)
        .get('/api/abdm/consent/active')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid patient ID format', async () => {
      const response = await request(app)
        .get('/api/abdm/consent/active?patientId=invalid-uuid')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/abdm/consent/:consentRequestId/revoke', () => {
    it('should revoke consent successfully', async () => {
      const consentId = '123e4567-e89b-12d3-a456-426614174000';
      const revokeData = { reason: 'Patient requested revocation' };

      // Mock authentication
      jest.doMock('../src/middleware/auth.middleware', () => ({
        verifyToken: (req, res, next) => {
          req.user = { id: 'user-id' };
          next();
        }
      }));

      const response = await request(app)
        .post(`/api/abdm/consent/${consentId}/revoke`)
        .set('Authorization', 'Bearer mock-token')
        .send(revokeData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for missing reason', async () => {
      const consentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .post(`/api/abdm/consent/${consentId}/revoke`)
        .set('Authorization', 'Bearer mock-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for short reason', async () => {
      const consentId = '123e4567-e89b-12d3-a456-426614174000';
      const revokeData = { reason: 'Short' };

      const response = await request(app)
        .post(`/api/abdm/consent/${consentId}/revoke`)
        .set('Authorization', 'Bearer mock-token')
        .send(revokeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/abdm/consent/callback', () => {
    it('should handle consent callback successfully', async () => {
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

      const response = await request(app)
        .post('/api/abdm/consent/callback')
        .send(callbackData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/abdm/consent/:consentRequestId/audit', () => {
    it('should return audit trail successfully', async () => {
      const consentId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock authentication
      jest.doMock('../src/middleware/auth.middleware', () => ({
        verifyToken: (req, res, next) => {
          req.user = { id: 'user-id' };
          next();
        }
      }));

      const response = await request(app)
        .get(`/api/abdm/consent/${consentId}/audit`)
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('auditTrail');
    });
  });
});
