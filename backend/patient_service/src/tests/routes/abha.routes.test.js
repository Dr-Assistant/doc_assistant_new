/**
 * ABHA Routes Tests
 */

const request = require('supertest');
const express = require('express');
const abhaRoutes = require('../../routes/abha.routes');
const abhaService = require('../../services/abha.service');

// Mock services
jest.mock('../../services/abha.service');
jest.mock('../../middleware/auth.middleware', () => ({
  authenticate: (req, res, next) => next(),
  authorizeRoles: (roles) => (req, res, next) => next()
}));

describe('ABHA Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/patients/abha', abhaRoutes);
  });

  describe('POST /verify', () => {
    it('should verify ABHA ID successfully', async () => {
      const mockResponse = {
        isValid: true,
        details: { name: 'Test Patient' }
      };

      abhaService.verifyABHAId.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/patients/abha/verify')
        .send({ abhaId: 'test-abha-id' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(abhaService.verifyABHAId).toHaveBeenCalledWith('test-abha-id');
    });

    it('should handle missing ABHA ID', async () => {
      const response = await request(app)
        .post('/api/patients/abha/verify')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /consent/:patientId', () => {
    it('should create consent request successfully', async () => {
      const mockResponse = {
        consentId: 'test-consent-id',
        status: 'PENDING'
      };

      abhaService.createConsentRequest.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/patients/abha/consent/test-patient-id')
        .send({
          abhaId: 'test-abha-id',
          purpose: { type: 'treatment' }
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(abhaService.createConsentRequest).toHaveBeenCalledWith(
        'test-patient-id',
        'test-abha-id',
        { type: 'treatment' }
      );
    });

    it('should handle invalid patient ID', async () => {
      const response = await request(app)
        .post('/api/patients/abha/consent/invalid-id')
        .send({
          abhaId: 'test-abha-id',
          purpose: { type: 'treatment' }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /consent/callback', () => {
    it('should handle consent callback successfully', async () => {
      const mockCallbackData = {
        consentId: 'test-consent-id',
        status: 'GRANTED'
      };
      const mockResponse = {
        records: []
      };

      abhaService.handleConsentCallback.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/patients/abha/consent/callback')
        .send(mockCallbackData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(abhaService.handleConsentCallback).toHaveBeenCalledWith(mockCallbackData);
    });

    it('should handle missing consent ID', async () => {
      const response = await request(app)
        .post('/api/patients/abha/consent/callback')
        .send({ status: 'GRANTED' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /health-records/callback', () => {
    it('should handle health record callback successfully', async () => {
      const mockCallbackData = {
        patientId: 'test-patient-id',
        records: [{ type: 'prescription' }]
      };
      const mockResponse = {
        ...mockCallbackData,
        timestamp: expect.any(Date)
      };

      abhaService.handleHealthRecordCallback.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/patients/abha/health-records/callback')
        .send(mockCallbackData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(abhaService.handleHealthRecordCallback).toHaveBeenCalledWith(mockCallbackData);
    });

    it('should handle missing patient ID', async () => {
      const response = await request(app)
        .post('/api/patients/abha/health-records/callback')
        .send({ records: [] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });
}); 