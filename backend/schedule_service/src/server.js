/**
 * Schedule Service
 * This service handles appointment scheduling and doctor availability for the Dr. Assistant application
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/error.middleware');
const { sequelize } = require('./models');
const cacheService = require('./services/cache.service');

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
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

// Apply rate limiting to API endpoints
app.use('/api', apiLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    headers: {
      authorization: req.headers.authorization ? 'Bearer [REDACTED]' : 'None',
      'content-type': req.headers['content-type']
    }
  });
  next();
});

// Routes
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/availability', require('./routes/availability.routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'schedule-service',
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
const PORT = process.env.PORT || 8004;

// Start server
const server = app.listen(PORT, async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync database models (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized successfully');

    // Initialize Redis
    await cacheService.initRedis();

    logger.info(`Schedule Service running on port ${PORT}`);
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

// Handle SIGTERM
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    logger.info('Process terminated');
    await cacheService.close();
    process.exit(0);
  });
});

module.exports = { app, server };
