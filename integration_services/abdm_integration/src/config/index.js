/**
 * Configuration module
 * Loads and validates environment variables
 */

require('dotenv').config();
const { logger } = require('../utils/logger');

// Define required environment variables
const requiredEnvVars = [
  'ABDM_BASE_URL',
  'ABDM_CLIENT_ID',
  'ABDM_CLIENT_SECRET',
  'ABDM_AUTH_URL'
];

// Check for missing environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Export configuration
module.exports = {
  // Server configuration
  port: process.env.PORT || 8101,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // ABDM configuration
  abdm: {
    baseUrl: process.env.ABDM_BASE_URL,
    clientId: process.env.ABDM_CLIENT_ID,
    clientSecret: process.env.ABDM_CLIENT_SECRET,
    authUrl: process.env.ABDM_AUTH_URL,
    consentCallbackUrl: process.env.CONSENT_CALLBACK_URL || 'http://localhost:8101/api/abdm/consent/callback',
    healthRecordCallbackUrl: process.env.HEALTH_RECORD_CALLBACK_URL || 'http://localhost:8101/api/abdm/health-records/callback'
  },
  
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'dr_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },
  
  // Authentication service
  authService: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:8001'
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};
