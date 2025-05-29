/**
 * Configuration module
 * Loads and validates environment variables
 */

require('dotenv').config();

// Define required environment variables
const requiredEnvVars = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET'
];

// Check for missing environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Export configuration
module.exports = {
  // Server configuration
  port: process.env.PORT || 8016,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },

  // Authentication
  jwtSecret: process.env.JWT_SECRET,

  // Service URLs
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8020',
    user: process.env.USER_SERVICE_URL || 'http://localhost:8012',
    patient: process.env.PATIENT_SERVICE_URL || 'http://localhost:8017',
    encounter: process.env.ENCOUNTER_SERVICE_URL || 'http://localhost:8005'
  },

  // Task configuration
  task: {
    defaultPriority: process.env.DEFAULT_TASK_PRIORITY || 'medium',
    overdueNotificationHours: parseInt(process.env.OVERDUE_NOTIFICATION_HOURS) || 24,
    maxTasksPerPage: parseInt(process.env.MAX_TASKS_PER_PAGE) || 50
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};
