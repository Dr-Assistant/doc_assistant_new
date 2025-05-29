/**
 * Database Models
 * This module initializes the database connection and models
 */

const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');

// Load environment variables
require('dotenv').config();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'dr_assistant',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '5', 10),
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const Appointment = require('./appointment.model')(sequelize);
const DoctorAvailability = require('./availability.model')(sequelize);

// Define associations
// Both models reference the same doctor_id from the user service
// No direct association needed between them

// Export models and Sequelize instance
module.exports = {
  sequelize,
  Appointment,
  DoctorAvailability
};
