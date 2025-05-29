const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Import utilities
const { logger } = require('./utils/logger');
const { errorHandler } = require('./utils/error-handler');

// Import routes
const voiceRecordingRoutes = require('./routes/voiceRecording.routes');
const transcriptionRoutes = require('./routes/transcription.routes');
const healthRoutes = require('./routes/health.routes');

// Create Express app
const app = express();

// Trust proxy for accurate IP addresses
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
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Request ID middleware for tracing
app.use((req, res, next) => {
  req.requestId = require('crypto').randomBytes(16).toString('hex');
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check routes (no authentication required)
app.use('/health', healthRoutes);

// API routes
app.use('/api/voice-recordings', voiceRecordingRoutes);
app.use('/api/transcriptions', transcriptionRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Voice Recording Service',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      voiceRecordings: '/api/voice-recordings',
      transcriptions: '/api/transcriptions',
      docs: '/api/docs'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    service: 'Voice Recording Service API',
    version: '1.0.0',
    endpoints: {
      // Voice Recording endpoints
      'POST /api/voice-recordings': 'Upload and create a new voice recording',
      'GET /api/voice-recordings/:id': 'Get voice recording by ID',
      'GET /api/voice-recordings/encounter/:encounterId': 'Get recordings for an encounter',
      'PUT /api/voice-recordings/:id/status': 'Update recording status',
      'DELETE /api/voice-recordings/:id': 'Delete voice recording',
      'GET /api/voice-recordings/:id/download': 'Download audio file',
      'GET /api/voice-recordings/validation/info': 'Get validation limits and formats',
      'PUT /api/voice-recordings/:id/retention': 'Update retention policy',
      'PUT /api/voice-recordings/:id/extend-retention': 'Extend retention period',
      'GET /api/voice-recordings/admin/retention/statistics': 'Get retention statistics (admin)',
      'POST /api/voice-recordings/admin/retention/cleanup': 'Cleanup expired recordings (admin)',

      // Transcription endpoints
      'POST /api/transcriptions': 'Create and start transcription for a voice recording',
      'GET /api/transcriptions/:transcriptionId': 'Get transcription by ID',
      'GET /api/transcriptions/voice-recording/:voiceRecordingId': 'Get transcription by voice recording ID',
      'GET /api/transcriptions/encounter/:encounterId': 'Get transcriptions by encounter ID',
      'POST /api/transcriptions/:transcriptionId/retry': 'Retry failed transcription',
      'GET /api/transcriptions/stats': 'Get transcription statistics',
      'PUT /api/transcriptions/:transcriptionId/metadata': 'Update transcription metadata',
      'GET /api/transcriptions/admin/pending': 'Get pending transcriptions (admin)',
      'POST /api/transcriptions/admin/process-pending': 'Process all pending transcriptions (admin)',
      'DELETE /api/transcriptions/:transcriptionId': 'Delete transcription (admin)'
    },
    authentication: 'Bearer token required for all API endpoints',
    uploadLimits: {
      maxFileSize: process.env.MAX_FILE_SIZE || '100MB',
      allowedFormats: process.env.ALLOWED_MIME_TYPES || 'audio/mpeg,audio/wav,audio/mp4,audio/webm,audio/ogg',
      maxDuration: process.env.MAX_DURATION || '3600 seconds'
    }
  });
});

// Handle 404 errors
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      path: req.originalUrl
    }
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Close server
  if (app.server) {
    app.server.close(() => {
      logger.info('HTTP server closed');

      // Close database connection
      const { disconnect } = require('./config/database');
      disconnect().then(() => {
        logger.info('Database connection closed');
        process.exit(0);
      }).catch((error) => {
        logger.error('Error closing database connection:', error);
        process.exit(1);
      });
    });
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
