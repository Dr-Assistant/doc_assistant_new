const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

/**
 * @route GET /health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Prescription Generation Service',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      gemini: 'unknown',
      memory: 'unknown'
    }
  };

  try {
    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.checks.database = 'healthy';
    } else {
      healthCheck.checks.database = 'unhealthy';
      healthCheck.status = 'DEGRADED';
    }

    // Check Gemini API availability
    try {
      if (process.env.GOOGLE_GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        
        // Simple test to check if API is accessible
        healthCheck.checks.gemini = 'healthy';
      } else {
        healthCheck.checks.gemini = 'not_configured';
        healthCheck.status = 'DEGRADED';
      }
    } catch (error) {
      healthCheck.checks.gemini = 'unhealthy';
      healthCheck.status = 'DEGRADED';
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    healthCheck.checks.memory = {
      status: memoryUsageMB.heapUsed < 500 ? 'healthy' : 'warning',
      usage: memoryUsageMB
    };

    // Overall status
    if (healthCheck.checks.database === 'unhealthy' || healthCheck.checks.gemini === 'unhealthy') {
      healthCheck.status = 'UNHEALTHY';
    }

    const statusCode = healthCheck.status === 'OK' ? 200 : 
                      healthCheck.status === 'DEGRADED' ? 200 : 503;

    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      service: 'Prescription Generation Service',
      error: error.message
    });
  }
});

/**
 * @route GET /health/detailed
 * @desc Detailed health check with more information
 * @access Public
 */
router.get('/detailed', async (req, res) => {
  const detailedHealth = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Prescription Generation Service',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid
    },
    memory: process.memoryUsage(),
    dependencies: {
      database: {
        type: 'MongoDB',
        status: 'unknown',
        connection: mongoose.connection.readyState
      },
      ai: {
        provider: 'Google Gemini',
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
        status: 'unknown'
      }
    },
    configuration: {
      port: process.env.PORT || 9003,
      logLevel: process.env.LOG_LEVEL || 'info',
      maxRetries: process.env.MAX_RETRIES || 3,
      confidenceThreshold: process.env.CONFIDENCE_THRESHOLD || 0.7,
      drugInteractionCheck: process.env.ENABLE_DRUG_INTERACTION_CHECK || 'true',
      dosageValidation: process.env.ENABLE_DOSAGE_VALIDATION || 'true'
    }
  };

  try {
    // Database check
    if (mongoose.connection.readyState === 1) {
      detailedHealth.dependencies.database.status = 'connected';
      detailedHealth.dependencies.database.host = mongoose.connection.host;
      detailedHealth.dependencies.database.name = mongoose.connection.name;
    } else {
      detailedHealth.dependencies.database.status = 'disconnected';
      detailedHealth.status = 'DEGRADED';
    }

    // AI service check
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      detailedHealth.dependencies.ai.status = 'configured';
      detailedHealth.dependencies.ai.keyConfigured = true;
    } else {
      detailedHealth.dependencies.ai.status = 'not_configured';
      detailedHealth.dependencies.ai.keyConfigured = false;
      detailedHealth.status = 'DEGRADED';
    }

    const statusCode = detailedHealth.status === 'OK' ? 200 : 
                      detailedHealth.status === 'DEGRADED' ? 200 : 503;

    res.status(statusCode).json(detailedHealth);
  } catch (error) {
    res.status(503).json({
      status: 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      service: 'Prescription Generation Service',
      error: error.message
    });
  }
});

module.exports = router;
