/**
 * Database Models
 * This module initializes the database connection and models
 */

const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');

// Load environment variables
require('dotenv').config();

// Debug: Log the environment variables
console.log('User Service DB Configuration:', {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER
});

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'dr_assistant',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434', 10),
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
const User = require('./user.model')(sequelize);

// Export models and Sequelize instance
module.exports = {
  sequelize,
  User
};
