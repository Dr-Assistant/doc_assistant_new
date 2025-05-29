/**
 * Dashboard Service
 * This service provides dashboard data for the Dr. Assistant application
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/error.middleware');
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

// Routes
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'dashboard-service',
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
const PORT = process.env.PORT || 8005;

// Start server
const server = app.listen(PORT, async () => {
  try {
    // Initialize Redis
    await cacheService.initRedis();
    
    logger.info(`Dashboard Service running on port ${PORT}`);
  } catch (error) {
    logger.error('Error starting server:', error);
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
