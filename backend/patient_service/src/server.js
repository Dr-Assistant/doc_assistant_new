/**
 * Patient Service
 * This service handles patient management for the Dr. Assistant application
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/error.middleware');
const { sequelize, connectMongo } = require('./models');
const morgan = require('morgan');
const patientRoutes = require('./routes/patient.routes');
const medicalHistoryRoutes = require('./routes/medical.history.routes');
const abhaRoutes = require('./routes/abha.routes');
const searchRoutes = require('./routes/search.routes');

// Load environment variables
require('dotenv').config();

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.'
    }
  }
});

// Apply rate limiting to patient endpoints
app.use('/api/patients', apiLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/patients/medical-history', medicalHistoryRoutes);
app.use('/api/patients/abha', abhaRoutes);
app.use('/api/patients/search', searchRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'patient-service',
      status: 'up',
      timestamp: new Date()
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found'
    }
  });
});

// Set port
const PORT = process.env.PORT || 8003;

// Start server
const server = app.listen(PORT, async () => {
  try {
    // Test database connections
    await sequelize.authenticate();
    logger.info('PostgreSQL connection established successfully');
    
    await connectMongo();
    logger.info('MongoDB connection established successfully');
    
    logger.info(`Patient Service running on port ${PORT}`);
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = { app, server };
