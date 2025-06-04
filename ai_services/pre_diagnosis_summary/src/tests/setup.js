// Test setup file
require('dotenv').config({ path: '.env.test' });

// Mock external services by default
jest.mock('../services/abdm.service');
jest.mock('../services/patient.service');
jest.mock('../services/gemini.service');

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    req.user = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      email: 'test@example.com',
      role: 'doctor'
    };
    next();
  },
  authorize: (roles) => (req, res, next) => next(),
  optionalAuth: (req, res, next) => next()
}));

// Suppress console logs during tests unless explicitly needed
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}

// Global test utilities
global.testUtils = {
  createMockPatientData: () => ({
    demographics: {
      fullName: 'John Doe',
      age: 45,
      gender: 'male',
      bloodGroup: 'O+'
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
    allergies: [
      {
        allergen: 'Penicillin',
        type: 'drug',
        severity: 'moderate',
        reaction: 'rash',
        source: 'local'
      }
    ],
    vitalSigns: {
      bloodPressure: { systolic: 140, diastolic: 90, unit: 'mmHg' },
      heartRate: { value: 72, unit: 'bpm' },
      temperature: { value: 98.6, unit: 'F' },
      weight: { value: 80, unit: 'kg' },
      height: { value: 175, unit: 'cm' },
      bmi: 26.1
    },
    sources: { local: true, abdm: false, questionnaire: true }
  }),

  createMockAISummary: () => ({
    keyFindings: ['Patient has controlled hypertension', 'No acute symptoms reported'],
    riskFactors: ['Age over 40', 'History of hypertension'],
    recommendations: ['Monitor blood pressure', 'Continue current medication'],
    urgencyLevel: 'medium',
    confidenceScore: 0.85,
    generatedAt: new Date(),
    model: 'gemini-1.5-pro',
    version: '1.0',
    processingTime: 2500,
    tokenUsage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 }
  }),

  createMockQuestionnaireData: () => ({
    chiefComplaint: 'Chest pain',
    duration: '2 days',
    severity: 'moderate',
    associatedSymptoms: 'Shortness of breath',
    pastMedicalHistory: 'Hypertension',
    currentMedications: 'Lisinopril',
    allergies: 'Penicillin'
  })
};
