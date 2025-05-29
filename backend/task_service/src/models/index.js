/**
 * Database Models Index
 * Initializes Sequelize and defines model relationships
 */

const { Sequelize } = require('sequelize');
const config = require('../config');
const { logger } = require('../utils/logger');

// Initialize Sequelize
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const Task = require('./task.model')(sequelize);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    return false;
  }
};

// Sync models (only in development)
const syncModels = async () => {
  if (config.nodeEnv === 'development') {
    try {
      await sequelize.sync({ alter: false });
      logger.info('Database models synchronized');
    } catch (error) {
      logger.error('Error synchronizing models:', error);
    }
  }
};

module.exports = {
  sequelize,
  Task,
  testConnection,
  syncModels
};
