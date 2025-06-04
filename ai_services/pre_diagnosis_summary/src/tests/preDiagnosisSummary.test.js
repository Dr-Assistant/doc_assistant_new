const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const PreDiagnosisSummary = require('../models/PreDiagnosisSummary');

// Mock external services
jest.mock('../services/abdm.service');
jest.mock('../services/patient.service');
jest.mock('../services/gemini.service');

const abdmService = require('../services/abdm.service');
const patientService = require('../services/patient.service');
const geminiService = require('../services/gemini.service');

describe('Pre-Diagnosis Summary Service', () => {
  let authToken;
  let testPatientId;
  let testDoctorId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/dr_assistant_test';
    await mongoose.connect(mongoUri);
    
    // Setup test data
    testPatientId = '123e4567-e89b-12d3-a456-426614174000';
    testDoctorId = '123e4567-e89b-12d3-a456-426614174001';
    authToken = 'Bearer test_jwt_token';
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    await PreDiagnosisSummary.deleteMany({});
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('POST /api/pre-diagnosis/generate', () => {
    it('should generate a pre-diagnosis summary successfully', async () => {
      // Mock service responses
      patientService.getPatientData.mockResolvedValue({
        demographics: {
          fullName: 'John Doe',
          age: 45,
          gender: 'male'
        },
        medicalHistory: [
          {
            condition: 'Hypertension',
            status: 'active',
            diagnosedDate: '2020-01-01',
            source: 'local'
          }
        ],
        medications: [
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'daily',
            status: 'active',
            source: 'local'
          }
        ],
        allergies: [],
        vitalSigns: null,
        sources: { local: true, abdm: false, questionnaire: false }
      });

      abdmService.getPatientHealthRecords.mockResolvedValue({
        records: [],
        medicalHistory: [],
        medications: [],
        allergies: [],
        sources: [],
        lastFetched: new Date()
      });

      geminiService.generatePreDiagnosisSummary.mockResolvedValue({
        keyFindings: ['Patient has controlled hypertension'],
        riskFactors: ['Age over 40', 'History of hypertension'],
        recommendations: ['Monitor blood pressure', 'Continue current medication'],
        urgencyLevel: 'medium',
        confidenceScore: 0.85,
        generatedAt: new Date(),
        model: 'gemini-1.5-pro',
        version: '1.0',
        processingTime: 2500,
        tokenUsage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 }
      });

      const response = await request(app)
        .post('/api/pre-diagnosis/generate')
        .set('Authorization', authToken)
        .send({
          patientId: testPatientId,
          questionnaireData: {
            chiefComplaint: 'Chest pain',
            duration: '2 days'
          },
          priority: 'medium'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.patientId).toBe(testPatientId);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.aiSummary).toHaveProperty('keyFindings');
      expect(response.body.data.aiSummary.urgencyLevel).toBe('medium');
    });

    it('should return validation error for invalid patient ID', async () => {
      const response = await request(app)
        .post('/api/pre-diagnosis/generate')
        .set('Authorization', authToken)
        .send({
          patientId: 'invalid-uuid',
          questionnaireData: {}
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should handle service errors gracefully', async () => {
      patientService.getPatientData.mockRejectedValue(new Error('Patient service unavailable'));
      
      abdmService.getPatientHealthRecords.mockResolvedValue({
        records: [],
        medicalHistory: [],
        medications: [],
        allergies: [],
        sources: [],
        lastFetched: new Date(),
        errors: ['Patient service unavailable']
      });

      geminiService.generatePreDiagnosisSummary.mockResolvedValue({
        keyFindings: ['Limited data available'],
        riskFactors: [],
        recommendations: ['Gather more patient information'],
        urgencyLevel: 'medium',
        confidenceScore: 0.3,
        generatedAt: new Date(),
        model: 'gemini-1.5-pro',
        version: '1.0',
        processingTime: 1500,
        tokenUsage: { inputTokens: 200, outputTokens: 100, totalTokens: 300 }
      });

      const response = await request(app)
        .post('/api/pre-diagnosis/generate')
        .set('Authorization', authToken)
        .send({
          patientId: testPatientId,
          questionnaireData: {
            chiefComplaint: 'Headache'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.aiSummary.confidenceScore).toBeLessThan(0.5);
    });
  });

  describe('GET /api/pre-diagnosis/:summaryId', () => {
    it('should retrieve a summary by ID', async () => {
      // Create test summary
      const summary = new PreDiagnosisSummary({
        patientId: testPatientId,
        doctorId: testDoctorId,
        status: 'completed',
        aiSummary: {
          keyFindings: ['Test finding'],
          riskFactors: ['Test risk'],
          recommendations: ['Test recommendation'],
          urgencyLevel: 'medium',
          confidenceScore: 0.8,
          generatedAt: new Date(),
          model: 'gemini-1.5-pro',
          version: '1.0',
          processingTime: 2000
        }
      });
      await summary.save();

      const response = await request(app)
        .get(`/api/pre-diagnosis/${summary._id}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(summary._id.toString());
      expect(response.body.data.patientId).toBe(testPatientId);
    });

    it('should return 404 for non-existent summary', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/pre-diagnosis/${nonExistentId}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/pre-diagnosis/patient/:patientId', () => {
    it('should retrieve summaries for a patient', async () => {
      // Create test summaries
      const summary1 = new PreDiagnosisSummary({
        patientId: testPatientId,
        doctorId: testDoctorId,
        status: 'completed',
        createdAt: new Date('2023-01-01')
      });
      
      const summary2 = new PreDiagnosisSummary({
        patientId: testPatientId,
        doctorId: testDoctorId,
        status: 'completed',
        createdAt: new Date('2023-01-02')
      });

      await summary1.save();
      await summary2.save();

      const response = await request(app)
        .get(`/api/pre-diagnosis/patient/${testPatientId}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].patientId).toBe(testPatientId);
    });
  });

  describe('GET /api/pre-diagnosis/my/recent', () => {
    it('should retrieve recent summaries for current user', async () => {
      // Create test summaries
      const summary = new PreDiagnosisSummary({
        patientId: testPatientId,
        doctorId: testDoctorId,
        status: 'completed',
        aiSummary: {
          urgencyLevel: 'high',
          confidenceScore: 0.9
        }
      });
      await summary.save();

      const response = await request(app)
        .get('/api/pre-diagnosis/my/recent')
        .set('Authorization', authToken)
        .query({ limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].doctorId).toBe(testDoctorId);
    });
  });

  describe('GET /api/pre-diagnosis/urgent', () => {
    it('should retrieve only urgent summaries', async () => {
      // Create test summaries with different urgency levels
      const urgentSummary = new PreDiagnosisSummary({
        patientId: testPatientId,
        doctorId: testDoctorId,
        status: 'completed',
        aiSummary: {
          urgencyLevel: 'urgent',
          confidenceScore: 0.9
        }
      });

      const normalSummary = new PreDiagnosisSummary({
        patientId: testPatientId,
        doctorId: testDoctorId,
        status: 'completed',
        aiSummary: {
          urgencyLevel: 'medium',
          confidenceScore: 0.8
        }
      });

      await urgentSummary.save();
      await normalSummary.save();

      const response = await request(app)
        .get('/api/pre-diagnosis/urgent')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].aiSummary.urgencyLevel).toBe('urgent');
    });
  });
});
