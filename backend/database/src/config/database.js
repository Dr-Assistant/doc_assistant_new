/**
 * Database Configuration
 * This module provides configuration for database connections
 */

const { Pool } = require('pg');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const { logger } = require('../utils/logger');

// Load environment variables
require('dotenv').config();

// PostgreSQL Configuration
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'dr_assistant',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum number of clients in the pool
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10), // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '5000', 10), // How long to wait for a connection
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false
};

// MongoDB Configuration
const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dr_assistant',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT || '5000', 10),
    maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10', 10)
  }
};

// Redis Configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'dr_assistant:',
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Create PostgreSQL pool
const pgPool = new Pool(pgConfig);

// PostgreSQL error handling
pgPool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', { error: err.message, stack: err.stack });
});

// Create MongoDB connection
let mongoConnection = null;
const connectMongo = async () => {
  if (mongoConnection) return mongoConnection;
  
  try {
    mongoConnection = await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    logger.info('MongoDB connected successfully');
    
    // MongoDB connection error handling
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message, stack: err.stack });
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      mongoConnection = null;
    });
    
    return mongoConnection;
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error.message, stack: error.stack });
    throw error;
  }
};

// Create Redis client
const redisClient = new Redis(redisConfig);

// Redis error handling
redisClient.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message, stack: err.stack });
});

redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

// Export database connections
module.exports = {
  pgPool,
  connectMongo,
  redisClient,
  
  // Helper function to get a PostgreSQL client from the pool
  getPgClient: async () => {
    const client = await pgPool.connect();
    return client;
  },
  
  // Helper function to close all database connections
  closeConnections: async () => {
    try {
      await pgPool.end();
      logger.info('PostgreSQL pool has ended');
    } catch (error) {
      logger.error('Error closing PostgreSQL pool', { error: error.message, stack: error.stack });
    }
    
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      }
    } catch (error) {
      logger.error('Error closing MongoDB connection', { error: error.message, stack: error.stack });
    }
    
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection', { error: error.message, stack: error.stack });
    }
  }
};
