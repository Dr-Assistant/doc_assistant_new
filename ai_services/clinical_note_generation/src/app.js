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
const clinicalNoteRoutes = require('./routes/clinicalNote.routes');
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
app.use('/api/clinical-notes', clinicalNoteRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Clinical Note Generation Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      clinicalNotes: '/api/clinical-notes',
      docs: '/api/docs'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    service: 'Clinical Note Generation Service',
    version: '1.0.0',
    description: 'AI-powered clinical note generation using Google Gemini',
    endpoints: {
      'POST /api/clinical-notes/generate': 'Generate clinical note from transcription',
      'GET /api/clinical-notes/:id': 'Get clinical note by ID',
      'GET /api/clinical-notes/encounter/:encounterId': 'Get clinical note by encounter ID',
      'PUT /api/clinical-notes/:id': 'Update clinical note',
      'POST /api/clinical-notes/:id/review': 'Review clinical note',
      'POST /api/clinical-notes/:id/approve': 'Approve clinical note',
      'POST /api/clinical-notes/:id/sign': 'Sign clinical note',
      'GET /api/clinical-notes/patient/:patientId': 'Get clinical notes by patient',
      'GET /api/clinical-notes/doctor/:doctorId': 'Get clinical notes by doctor',
      'GET /api/clinical-notes/pending': 'Get pending clinical notes for review',
      'GET /api/clinical-notes/stats': 'Get clinical note statistics',
      'POST /api/clinical-notes/:id/regenerate': 'Regenerate clinical note'
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>'
    },
    rateLimit: {
      general: '100 requests per 15 minutes',
      aiGeneration: '5 requests per 15 minutes'
    },
    models: {
      ai: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
      provider: 'Google Gemini'
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
