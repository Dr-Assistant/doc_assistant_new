/**
 * Encounter Service Server
 * Main entry point for the Dr. Assistant Encounter Service
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('express-async-errors');
require('dotenv').config();

const { logger } = require('./utils/logger');
const { sequelize, connectMongo } = require('./models');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// Import routes
const encounterRoutes = require('./routes/encounter.routes');
const consultationRoutes = require('./routes/consultation.routes');
const vitalSignsRoutes = require('./routes/vitalSigns.routes');
const clinicalNotesRoutes = require('./routes/clinicalNotes.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();
const PORT = process.env.PORT || 8006;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Health check routes (no auth required)
app.use('/health', healthRoutes);

// API routes with authentication
app.use('/api/encounters', authMiddleware, encounterRoutes);
app.use('/api/consultations', authMiddleware, consultationRoutes);
app.use('/api/vital-signs', authMiddleware, vitalSignsRoutes);
app.use('/api/clinical-notes', authMiddleware, clinicalNotesRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Dr. Assistant Encounter Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      encounters: '/api/encounters',
      consultations: '/api/consultations',
      vitalSigns: '/api/vital-signs',
      clinicalNotes: '/api/clinical-notes'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Database initialization and server startup
const initializeServer = async () => {
  try {
    // Connect to PostgreSQL
    await sequelize.authenticate();
    logger.info('PostgreSQL connection established successfully');

    // Sync database models
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized');
    }

    // Connect to MongoDB
    await connectMongo();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Encounter Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
    });

  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  try {
    await sequelize.close();
    logger.info('Database connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize server
if (process.env.NODE_ENV !== 'test') {
  initializeServer();
}

module.exports = app;
