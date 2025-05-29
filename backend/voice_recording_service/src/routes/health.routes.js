const express = require('express');
const router = express.Router();
const { isConnected } = require('../config/database');
const audioStorageService = require('../services/audioStorage.service');
const { logger } = require('../utils/logger');

/**
 * @route GET /health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'voice-recording-service',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {}
    };

    // Check database connection
    try {
      const dbConnected = await isConnected();
      health.checks.database = {
        status: dbConnected ? 'healthy' : 'unhealthy',
        message: dbConnected ? 'Connected to MongoDB' : 'Not connected to MongoDB'
      };
    } catch (error) {
      health.checks.database = {
        status: 'unhealthy',
        message: error.message
      };
      health.status = 'unhealthy';
    }

    // Check storage service
    try {
      await audioStorageService.getStorageStats();
      health.checks.storage = {
        status: 'healthy',
        message: 'Storage service is operational'
      };
    } catch (error) {
      health.checks.storage = {
        status: 'unhealthy',
        message: error.message
      };
      health.status = 'unhealthy';
    }

    // Check environment variables
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'ENCRYPTION_KEY'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    health.checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
      message: missingEnvVars.length === 0 
        ? 'All required environment variables are set'
        : `Missing environment variables: ${missingEnvVars.join(', ')}`
    };

    if (missingEnvVars.length > 0) {
      health.status = 'unhealthy';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'voice-recording-service',
      error: error.message
    });
  }
});

/**
 * @route GET /health/ready
 * @desc Readiness check endpoint
 * @access Public
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if service is ready to accept requests
    const dbConnected = await isConnected();
    
    if (!dbConnected) {
      return res.status(503).json({
        ready: false,
        message: 'Database not connected'
      });
    }

    // Check if required environment variables are set
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'ENCRYPTION_KEY'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      return res.status(503).json({
        ready: false,
        message: `Missing environment variables: ${missingEnvVars.join(', ')}`
      });
    }

    res.json({
      ready: true,
      message: 'Service is ready to accept requests'
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      ready: false,
      message: error.message
    });
  }
});

/**
 * @route GET /health/live
 * @desc Liveness check endpoint
 * @access Public
 */
router.get('/live', (req, res) => {
  // Simple liveness check - if this endpoint responds, the service is alive
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * @route GET /health/metrics
 * @desc Basic metrics endpoint
 * @access Public
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    };

    // Add storage metrics if available
    try {
      const storageStats = await audioStorageService.getStorageStats();
      metrics.storage = storageStats;
    } catch (error) {
      metrics.storage = { error: error.message };
    }

    res.json(metrics);
  } catch (error) {
    logger.error('Metrics collection failed:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
