const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Basic health check
 * @route GET /health
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pre-Diagnosis Summary Service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

/**
 * Detailed health check with dependencies
 * @route GET /health/detailed
 */
router.get('/detailed', async (req, res) => {
  const healthCheck = {
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    dependencies: {}
  };

  // Check MongoDB connection
  try {
    const mongoState = mongoose.connection.readyState;
    const mongoStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    healthCheck.dependencies.mongodb = {
      status: mongoState === 1 ? 'healthy' : 'unhealthy',
      state: mongoStates[mongoState],
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };

    if (mongoState !== 1) {
      healthCheck.success = false;
    }
  } catch (error) {
    healthCheck.dependencies.mongodb = {
      status: 'unhealthy',
      error: error.message
    };
    healthCheck.success = false;
  }

  // Check Auth Service connectivity
  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
    const authResponse = await axios.get(`${authServiceUrl}/health`, {
      timeout: 3000
    });

    healthCheck.dependencies.authService = {
      status: 'healthy',
      url: authServiceUrl,
      responseTime: authResponse.headers['x-response-time'] || 'unknown'
    };
  } catch (error) {
    healthCheck.dependencies.authService = {
      status: 'unhealthy',
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
      error: error.message
    };
    // Auth service being down doesn't make the whole service unhealthy
    // as it's only needed for authenticated requests
  }

  // Check ABDM Integration Service connectivity
  try {
    const abdmServiceUrl = process.env.ABDM_SERVICE_URL || 'http://localhost:8101';
    const abdmResponse = await axios.get(`${abdmServiceUrl}/health`, {
      timeout: 3000
    });

    healthCheck.dependencies.abdmService = {
      status: 'healthy',
      url: abdmServiceUrl,
      responseTime: abdmResponse.headers['x-response-time'] || 'unknown'
    };
  } catch (error) {
    healthCheck.dependencies.abdmService = {
      status: 'unhealthy',
      url: process.env.ABDM_SERVICE_URL || 'http://localhost:8101',
      error: error.message
    };
  }

  // Check Patient Service connectivity
  try {
    const patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:8007';
    const patientResponse = await axios.get(`${patientServiceUrl}/health`, {
      timeout: 3000
    });

    healthCheck.dependencies.patientService = {
      status: 'healthy',
      url: patientServiceUrl,
      responseTime: patientResponse.headers['x-response-time'] || 'unknown'
    };
  } catch (error) {
    healthCheck.dependencies.patientService = {
      status: 'unhealthy',
      url: process.env.PATIENT_SERVICE_URL || 'http://localhost:8007',
      error: error.message
    };
  }

  // Check Gemini AI availability
  try {
    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
    healthCheck.dependencies.geminiAI = {
      status: geminiApiKey ? 'configured' : 'not_configured',
      hasApiKey: !!geminiApiKey
    };
  } catch (error) {
    healthCheck.dependencies.geminiAI = {
      status: 'error',
      error: error.message
    };
  }

  const statusCode = healthCheck.success ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

/**
 * Readiness probe for Kubernetes
 * @route GET /health/ready
 */
router.get('/ready', (req, res) => {
  const isReady = mongoose.connection.readyState === 1;
  
  if (isReady) {
    res.status(200).json({
      success: true,
      message: 'Service is ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      success: false,
      message: 'Service is not ready',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Liveness probe for Kubernetes
 * @route GET /health/live
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service is alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
