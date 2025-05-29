const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import utilities
const logger = require('./utils/logger');
const { 
  errorHandler, 
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException
} = require('./utils/error-handler');

// Import routes
const prescriptionRoutes = require('./routes/prescription.routes');
const healthRoutes = require('./routes/health.routes');

// Import middleware
const { defaultRateLimit } = require('./middleware/rateLimit.middleware');

// Create Express app
const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Rate limiting
app.use(defaultRateLimit);

// Health check routes (no rate limiting)
app.use('/health', healthRoutes);

// API routes
app.use('/api/prescriptions', prescriptionRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Prescription Generation Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      prescriptions: '/api/prescriptions',
      docs: '/api/docs'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    service: 'Prescription Generation Service',
    version: '1.0.0',
    description: 'AI-powered prescription generation using Google Gemini',
    endpoints: {
      'POST /api/prescriptions/generate/clinical-note': 'Generate prescription from clinical note',
      'POST /api/prescriptions/generate/transcription': 'Generate prescription from transcription',
      'POST /api/prescriptions/generate/text': 'Generate prescription from text input',
      'GET /api/prescriptions/:id': 'Get prescription by ID',
      'GET /api/prescriptions/encounter/:encounterId': 'Get prescription by encounter ID',
      'PUT /api/prescriptions/:id': 'Update prescription',
      'POST /api/prescriptions/:id/review': 'Review prescription',
      'POST /api/prescriptions/:id/approve': 'Approve prescription',
      'POST /api/prescriptions/:id/sign': 'Sign prescription',
      'POST /api/prescriptions/:id/send': 'Send prescription to pharmacy',
      'GET /api/prescriptions/patient/:patientId': 'Get prescriptions by patient',
      'GET /api/prescriptions/doctor/:doctorId': 'Get prescriptions by doctor',
      'GET /api/prescriptions/pending': 'Get pending prescriptions for review',
      'GET /api/prescriptions/stats': 'Get prescription statistics'
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>'
    },
    rateLimit: {
      general: '100 requests per 15 minutes',
      aiGeneration: '10 requests per 15 minutes'
    },
    models: {
      ai: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
      provider: 'Google Gemini'
    },
    features: {
      drugInteractionCheck: process.env.ENABLE_DRUG_INTERACTION_CHECK === 'true',
      dosageValidation: process.env.ENABLE_DOSAGE_VALIDATION === 'true',
      medicationDatabase: 'Built-in medication database with 15+ common drugs',
      safetyChecks: 'Automated safety validation and compliance monitoring'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', handleUnhandledRejection);

// Handle uncaught exceptions
process.on('uncaughtException', handleUncaughtException);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
