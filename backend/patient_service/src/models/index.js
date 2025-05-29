/**
 * Database Models
 * This module initializes the database connection and models
 */

const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
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

// Connect to MongoDB
const connectMongo = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      logger.info('MongoDB connected successfully');
    } else {
      logger.warn('MongoDB URI not provided, skipping MongoDB connection');
    }
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    logger.warn('Continuing without MongoDB - medical history features may be limited');
    // Don't exit the process, just continue without MongoDB
  }
};

// Import models
const Patient = require('./patient.model')(sequelize);
const MedicalHistory = require('./medical.history.model');

// Export models and database connections
module.exports = {
  sequelize,
  connectMongo,
  Patient,
  MedicalHistory
};
