/**
 * Health Check Routes
 * Provides health and status endpoints for the Encounter Service
 */

const express = require('express');
const { sequelize } = require('../models');
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Basic health check
 */
router.get('/', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'Dr. Assistant Encounter Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
}));

/**
 * Detailed health check with dependencies
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  const healthCheck = {
    service: 'Dr. Assistant Encounter Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    dependencies: {}
  };

  // Check PostgreSQL connection
  try {
    await sequelize.authenticate();
    healthCheck.dependencies.postgresql = {
      status: 'healthy',
      responseTime: Date.now()
    };
  } catch (error) {
    healthCheck.dependencies.postgresql = {
      status: 'unhealthy',
      error: error.message
    };
    healthCheck.status = 'degraded';
  }

  // Check MongoDB connection
  try {
    if (mongoose.connection.readyState === 1) {
      healthCheck.dependencies.mongodb = {
        status: 'healthy',
        readyState: mongoose.connection.readyState
      };
    } else {
      healthCheck.dependencies.mongodb = {
        status: 'unhealthy',
        readyState: mongoose.connection.readyState
      };
      healthCheck.status = 'degraded';
    }
  } catch (error) {
    healthCheck.dependencies.mongodb = {
      status: 'unhealthy',
      error: error.message
    };
    healthCheck.status = 'degraded';
  }

  // Check external services
  const externalServices = [
    { name: 'auth_service', url: process.env.AUTH_SERVICE_URL },
    { name: 'patient_service', url: process.env.PATIENT_SERVICE_URL },
    { name: 'user_service', url: process.env.USER_SERVICE_URL }
  ];

  for (const service of externalServices) {
    if (service.url) {
      try {
        const axios = require('axios');
        const startTime = Date.now();
        await axios.get(`${service.url}/health`, { timeout: 5000 });
        healthCheck.dependencies[service.name] = {
          status: 'healthy',
          responseTime: Date.now() - startTime
        };
      } catch (error) {
        healthCheck.dependencies[service.name] = {
          status: 'unhealthy',
          error: error.message
        };
        // Don't mark as degraded for external services
      }
    } else {
      healthCheck.dependencies[service.name] = {
        status: 'not_configured'
      };
    }
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    success: healthCheck.status !== 'unhealthy',
    data: healthCheck
  });
}));

/**
 * Readiness probe
 */
router.get('/ready', asyncHandler(async (req, res) => {
  try {
    // Check if databases are ready
    await sequelize.authenticate();
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not ready');
    }

    res.status(200).json({
      success: true,
      data: {
        status: 'ready',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.logError(error, { context: 'readiness_check' });
    
    res.status(503).json({
      success: false,
      message: 'Service not ready',
      error: {
        code: 'NOT_READY',
        details: error.message
      }
    });
  }
}));

/**
 * Liveness probe
 */
router.get('/live', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
}));

/**
 * Database status
 */
router.get('/database', asyncHandler(async (req, res) => {
  const dbStatus = {
    postgresql: {},
    mongodb: {}
  };

  // PostgreSQL status
  try {
    const startTime = Date.now();
    await sequelize.authenticate();
    const responseTime = Date.now() - startTime;
    
    const [results] = await sequelize.query('SELECT version()');
    
    dbStatus.postgresql = {
      status: 'connected',
      responseTime,
      version: results[0].version,
      pool: {
        total: sequelize.connectionManager.pool.size,
        used: sequelize.connectionManager.pool.used,
        waiting: sequelize.connectionManager.pool.pending
      }
    };
  } catch (error) {
    dbStatus.postgresql = {
      status: 'disconnected',
      error: error.message
    };
  }

  // MongoDB status
  try {
    dbStatus.mongodb = {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  } catch (error) {
    dbStatus.mongodb = {
      status: 'error',
      error: error.message
    };
  }

  const allHealthy = dbStatus.postgresql.status === 'connected' && 
                    dbStatus.mongodb.status === 'connected';

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    data: dbStatus
  });
}));

/**
 * Service metrics
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };

  // Add database metrics if available
  try {
    const [pgResults] = await sequelize.query(`
      SELECT 
        count(*) as total_connections,
        sum(case when state = 'active' then 1 else 0 end) as active_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    
    metrics.postgresql = {
      connections: pgResults[0]
    };
  } catch (error) {
    metrics.postgresql = { error: 'Unable to fetch metrics' };
  }

  res.status(200).json({
    success: true,
    data: metrics
  });
}));

/**
 * Service information
 */
router.get('/info', asyncHandler(async (req, res) => {
  const info = {
    service: {
      name: 'Dr. Assistant Encounter Service',
      version: '1.0.0',
      description: 'Manages patient encounters, consultations, and clinical workflows',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 8006
    },
    features: [
      'Encounter management',
      'Consultation tracking',
      'Vital signs recording',
      'Diagnosis management',
      'Treatment planning',
      'Clinical notes',
      'Document management',
      'Provider participation tracking'
    ],
    endpoints: {
      encounters: '/api/encounters',
      consultations: '/api/consultations',
      vitalSigns: '/api/vital-signs',
      clinicalNotes: '/api/clinical-notes',
      health: '/health'
    },
    documentation: {
      api: '/api/docs',
      swagger: '/api/swagger'
    }
  };

  res.status(200).json({
    success: true,
    data: info
  });
}));

module.exports = router;
