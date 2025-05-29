/**
 * Cache Service
 * This module provides caching functionality for the application
 */

const { createClient } = require('redis');
const { logger } = require('../utils/logger');

// Load environment variables
require('dotenv').config();

// Create Redis client
let redisClient;

/**
 * Initialize Redis client
 * @returns {Promise<void>}
 */
const initRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URI || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
        reconnectStrategy: false // Disable automatic reconnection
      }
    });

    redisClient.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        logger.warn('Redis server not available, continuing without cache', { error: err.message });
        redisClient = null;
      } else {
        logger.error('Redis client error', { error: err.message, stack: err.stack });
      }
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected successfully');
    });

    redisClient.on('disconnect', () => {
      logger.warn('Redis client disconnected, continuing without cache');
      redisClient = null;
    });

    await redisClient.connect();
    logger.info('Redis client connected');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logger.warn('Redis server not available, continuing without cache', { error: error.message });
    } else {
      logger.error('Error initializing Redis client', { error: error.message, stack: error.stack });
    }
    // Continue without Redis
    redisClient = null;
  }
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached value or null
 */
const get = async (key) => {
  if (!redisClient) return null;

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Error getting value from cache', {
      error: error.message,
      stack: error.stack,
      key
    });
    return null;
  }
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} [expiry=3600] - Expiry time in seconds
 * @returns {Promise<boolean>} Success flag
 */
const set = async (key, value, expiry = 3600) => {
  if (!redisClient) return false;

  try {
    await redisClient.set(key, JSON.stringify(value), { EX: expiry });
    return true;
  } catch (error) {
    logger.error('Error setting value in cache', {
      error: error.message,
      stack: error.stack,
      key
    });
    return false;
  }
};

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success flag
 */
const del = async (key) => {
  if (!redisClient) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Error deleting value from cache', {
      error: error.message,
      stack: error.stack,
      key
    });
    return false;
  }
};

/**
 * Clear cache by pattern
 * @param {string} pattern - Key pattern
 * @returns {Promise<boolean>} Success flag
 */
const clearByPattern = async (pattern) => {
  if (!redisClient) return false;

  try {
    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    return true;
  } catch (error) {
    logger.error('Error clearing cache by pattern', {
      error: error.message,
      stack: error.stack,
      pattern
    });
    return false;
  }
};

/**
 * Close Redis connection
 * @returns {Promise<void>}
 */
const close = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis client disconnected');
  }
};

module.exports = {
  initRedis,
  get,
  set,
  del,
  clearByPattern,
  close
};
