/**
 * Database Infrastructure
 * This module exports all database components
 */

// Database configuration
const { 
  pgPool, 
  connectMongo, 
  redisClient, 
  getPgClient, 
  closeConnections 
} = require('./config/database');

// Base repositories
const BaseRepository = require('./repositories/base.repository');
const MongoRepository = require('./repositories/mongo.repository');

// Services
const CacheService = require('./services/cache.service');
const MigrationService = require('./services/migration.service');

// Utils
const { logger } = require('./utils/logger');

// Export all components
module.exports = {
  // Database connections
  pgPool,
  connectMongo,
  redisClient,
  getPgClient,
  closeConnections,
  
  // Base repositories
  BaseRepository,
  MongoRepository,
  
  // Services
  CacheService,
  MigrationService,
  
  // Utils
  logger
};
