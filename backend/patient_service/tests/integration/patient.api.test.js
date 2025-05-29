/**
 * Patient API Integration Tests
 * This module tests the patient API endpoints
 */

const request = require('supertest');
const { app, server } = require('../../src/server');
const { sequelize } = require('../../src/models');

// Mock authentication middleware
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    req.user = {
      id: 'test-user-id',
      role: 'doctor'
    };
    next();
  },
  authorizeRoles: (roles) => (req, res, next) => next()
}));

describe('Patient API', () => {
  // Sample patient data for testing
  const testPatient = {
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1990-01-01',
    gender: 'male',
    phone: '1234567890',
    email: 'john.doe@example.com'
  };

  let patientId;

  // Close server and database connections after all tests
  afterAll(async () => {
    await sequelize.close();
    server.close();
  });

  describe('POST /api/patients', () => {
    it('should create a new patient', async () => {
      const response = await request(app)
        .post('/api/patients')
        .send(testPatient)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.first_name).toBe(testPatient.first_name);
      expect(response.body.data.last_name).toBe(testPatient.last_name);

      // Save patient ID for later tests
      patientId = response.body.data.id;
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/patients')
        .send({
          first_name: 'Jane'
          // Missing last_name, date_of_birth, gender
        })
        .expect('Content-Type', /json/)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('errors');
    });
  });

  describe('GET /api/patients', () => {
    it('should return a list of patients with pagination', async () => {
      const response = await request(app)
        .get('/api/patients')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('patients');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.patients)).toBe(true);
    });

    it('should filter patients by status', async () => {
      const response = await request(app)
        .get('/api/patients?status=active')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients.every(p => p.status === 'active')).toBe(true);
    });

    it('should search patients by name', async () => {
      const response = await request(app)
        .get(`/api/patients?search=${testPatient.last_name}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/patients/:id', () => {
    it('should return a patient by ID', async () => {
      // Skip if patientId is not set
      if (!patientId) {
        return;
      }

      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(patientId);
      expect(response.body.data.first_name).toBe(testPatient.first_name);
      expect(response.body.data.last_name).toBe(testPatient.last_name);
    });

    it('should return 404 for non-existent patient', async () => {
      const response = await request(app)
        .get('/api/patients/00000000-0000-0000-0000-000000000000')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message');
    });
  });

  // Add more tests for other endpoints...
});
