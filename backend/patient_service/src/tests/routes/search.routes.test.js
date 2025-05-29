/**
 * Search Routes Tests
 */

const request = require('supertest');
const express = require('express');
const searchRoutes = require('../../routes/search.routes');
const searchService = require('../../services/search.service');

// Mock services
jest.mock('../../services/search.service');
jest.mock('../../middleware/auth.middleware', () => ({
  authenticate: (req, res, next) => next(),
  authorizeRoles: (roles) => (req, res, next) => next()
}));

describe('Search Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/patients/search', searchRoutes);
  });

  describe('GET /patients', () => {
    it('should search patients with text query', async () => {
      const mockResults = {
        total: 1,
        page: 1,
        limit: 10,
        results: [{
          id: 'test-id',
          first_name: 'John',
          last_name: 'Doe',
          relevanceScore: 15
        }]
      };

      searchService.searchPatients.mockResolvedValueOnce(mockResults);

      const response = await request(app)
        .get('/api/patients/search/patients')
        .query({ query: 'john' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(searchService.searchPatients).toHaveBeenCalledWith(expect.objectContaining({
        query: 'john'
      }));
    });

    it('should search patients with age range', async () => {
      const mockResults = {
        total: 1,
        page: 1,
        limit: 10,
        results: [{
          id: 'test-id',
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01'
        }]
      };

      searchService.searchPatients.mockResolvedValueOnce(mockResults);

      const response = await request(app)
        .get('/api/patients/search/patients')
        .query({
          'ageRange.min': '20',
          'ageRange.max': '30'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(searchService.searchPatients).toHaveBeenCalledWith(expect.objectContaining({
        ageRange: {
          min: 20,
          max: 30
        }
      }));
    });

    it('should search patients with medical history filters', async () => {
      const mockResults = {
        total: 1,
        page: 1,
        limit: 10,
        results: [{
          id: 'test-id',
          first_name: 'John',
          last_name: 'Doe',
          medicalHistory: {
            chronic_conditions: ['Diabetes']
          }
        }]
      };

      searchService.searchPatients.mockResolvedValueOnce(mockResults);

      const response = await request(app)
        .get('/api/patients/search/patients')
        .query({
          hasChronicCondition: 'true',
          hasAllergy: 'true'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(searchService.searchPatients).toHaveBeenCalledWith(expect.objectContaining({
        hasChronicCondition: true,
        hasAllergy: true
      }));
    });

    it('should handle invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/patients/search/patients')
        .query({
          'ageRange.min': 'invalid',
          'ageRange.max': 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /medical-history', () => {
    it('should search medical history by patient ID', async () => {
      const mockResults = {
        total: 1,
        page: 1,
        limit: 10,
        results: [{
          id: 'test-id',
          patient_id: 'test-patient-id',
          chronic_conditions: ['Diabetes']
        }]
      };

      searchService.searchMedicalHistory.mockResolvedValueOnce(mockResults);

      const response = await request(app)
        .get('/api/patients/search/medical-history')
        .query({ patientId: 'test-patient-id' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(searchService.searchMedicalHistory).toHaveBeenCalledWith(expect.objectContaining({
        patientId: 'test-patient-id'
      }));
    });

    it('should search medical history by condition', async () => {
      const mockResults = {
        total: 1,
        page: 1,
        limit: 10,
        results: [{
          id: 'test-id',
          chronic_conditions: [{ condition: 'Diabetes' }]
        }]
      };

      searchService.searchMedicalHistory.mockResolvedValueOnce(mockResults);

      const response = await request(app)
        .get('/api/patients/search/medical-history')
        .query({ condition: 'Diabetes' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(searchService.searchMedicalHistory).toHaveBeenCalledWith(expect.objectContaining({
        condition: 'Diabetes'
      }));
    });

    it('should search medical history by date range', async () => {
      const mockResults = {
        total: 1,
        page: 1,
        limit: 10,
        results: [{
          id: 'test-id',
          created_at: '2020-06-15'
        }]
      };

      searchService.searchMedicalHistory.mockResolvedValueOnce(mockResults);

      const response = await request(app)
        .get('/api/patients/search/medical-history')
        .query({
          'dateRange.start': '2020-01-01',
          'dateRange.end': '2020-12-31'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(searchService.searchMedicalHistory).toHaveBeenCalledWith(expect.objectContaining({
        dateRange: {
          start: '2020-01-01',
          end: '2020-12-31'
        }
      }));
    });

    it('should handle invalid date range', async () => {
      const response = await request(app)
        .get('/api/patients/search/medical-history')
        .query({
          'dateRange.start': 'invalid-date',
          'dateRange.end': 'invalid-date'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });
}); 