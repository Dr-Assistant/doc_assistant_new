/**
 * Appointment API Integration Tests
 * This module tests the appointment API endpoints
 */

const request = require('supertest');
const { app, server } = require('../../src/server');
const { sequelize } = require('../../src/models');
const cacheService = require('../../src/services/cache.service');

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

// Mock external service calls
jest.mock('axios', () => ({
  get: jest.fn().mockImplementation((url) => {
    if (url.includes('users')) {
      return Promise.resolve({ data: { success: true, data: { id: 'test-doctor-id' } } });
    } else if (url.includes('patients')) {
      return Promise.resolve({ data: { success: true, data: { id: 'test-patient-id' } } });
    }
    return Promise.reject(new Error('Not found'));
  }),
  post: jest.fn().mockResolvedValue({ data: { success: true } })
}));

describe('Appointment API', () => {
  // Sample appointment data for testing
  const testAppointment = {
    doctor_id: 'test-doctor-id',
    patient_id: 'test-patient-id',
    start_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    end_time: new Date(Date.now() + 5400000).toISOString(),   // 1.5 hours from now
    appointment_type: 'in_person',
    reason: 'Regular checkup'
  };

  let appointmentId;

  // Close server and database connections after all tests
  afterAll(async () => {
    await sequelize.close();
    await cacheService.close();
    server.close();
  });

  describe('POST /api/appointments', () => {
    it('should create a new appointment', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .send(testAppointment)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.doctor_id).toBe(testAppointment.doctor_id);
      expect(response.body.data.patient_id).toBe(testAppointment.patient_id);

      // Save appointment ID for later tests
      appointmentId = response.body.data.id;
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .send({
          doctor_id: 'test-doctor-id'
          // Missing patient_id, start_time, end_time, appointment_type
        })
        .expect('Content-Type', /json/)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('errors');
    });
  });

  describe('GET /api/appointments', () => {
    it('should return a list of appointments with pagination', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('appointments');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.appointments)).toBe(true);
    });

    it('should filter appointments by doctor ID', async () => {
      const response = await request(app)
        .get(`/api/appointments?doctorId=${testAppointment.doctor_id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments.every(a => a.doctor_id === testAppointment.doctor_id)).toBe(true);
    });

    it('should filter appointments by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/appointments?startDate=${today}&endDate=${tomorrow}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/appointments/:id', () => {
    it('should return an appointment by ID', async () => {
      // Skip if appointmentId is not set
      if (!appointmentId) {
        return;
      }

      const response = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(appointmentId);
      expect(response.body.data.doctor_id).toBe(testAppointment.doctor_id);
      expect(response.body.data.patient_id).toBe(testAppointment.patient_id);
    });

    it('should return 404 for non-existent appointment', async () => {
      const response = await request(app)
        .get('/api/appointments/00000000-0000-0000-0000-000000000000')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message');
    });
  });

  // Add more tests for other endpoints...
});
