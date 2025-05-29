/**
 * Cache Service
 * This module provides caching functionality using Redis
 */

const { redisClient } = require('../config/database');
const { logger } = require('../utils/logger');

class CacheService {
  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {Object} options - Cache options
   * @returns {Promise<boolean>} - Success flag
   */
  async set(key, value, options = {}) {
    const { ttl = null } = options;
    
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        await redisClient.set(key, stringValue, 'EX', ttl);
      } else {
        await redisClient.set(key, stringValue);
      }
      
      return true;
    } catch (error) {
      logger.error('Error setting cache value', { 
        error: error.message, 
        stack: error.stack,
        key
      });
      return false;
    }
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @param {Object} options - Cache options
   * @returns {Promise<any>} - Cached value
   */
  async get(key, options = {}) {
    const { parse = true } = options;
    
    try {
      const value = await redisClient.get(key);
      
      if (!value) {
        return null;
      }
      
      if (parse) {
        try {
          return JSON.parse(value);
        } catch (parseError) {
          return value;
        }
      }
      
      return value;
    } catch (error) {
      logger.error('Error getting cache value', { 
        error: error.message, 
        stack: error.stack,
        key
      });
      return null;
    }
  }

  /**
   * Delete a value from the cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success flag
   */
  async delete(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Error deleting cache value', { 
        error: error.message, 
        stack: error.stack,
        key
      });
      return false;
    }
  }

  /**
   * Check if a key exists in the cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Exists flag
   */
  async exists(key) {
    try {
      const exists = await redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Error checking cache key existence', { 
        error: error.message, 
        stack: error.stack,
        key
      });
      return false;
    }
  }

  /**
   * Set a value in the cache if the key doesn't exist
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {Object} options - Cache options
   * @returns {Promise<boolean>} - Success flag
   */
  async setNX(key, value, options = {}) {
    const { ttl = null } = options;
    
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        const result = await redisClient.set(key, stringValue, 'EX', ttl, 'NX');
        return result === 'OK';
      } else {
        const result = await redisClient.setnx(key, stringValue);
        return result === 1;
      }
    } catch (error) {
      logger.error('Error setting cache value if not exists', { 
        error: error.message, 
        stack: error.stack,
        key
      });
      return false;
    }
  }

  /**
   * Increment a value in the cache
   * @param {string} key - Cache key
   * @param {number} increment - Increment value
   * @returns {Promise<number>} - New value
   */
  async increment(key, increment = 1) {
    try {
      return await redisClient.incrby(key, increment);
    } catch (error) {
      logger.error('Error incrementing cache value', { 
        error: error.message, 
        stack: error.stack,
        key,
        increment
      });
      return null;
    }
  }

  /**
   * Decrement a value in the cache
   * @param {string} key - Cache key
   * @param {number} decrement - Decrement value
   * @returns {Promise<number>} - New value
   */
  async decrement(key, decrement = 1) {
    try {
      return await redisClient.decrby(key, decrement);
    } catch (error) {
      logger.error('Error decrementing cache value', { 
        error: error.message, 
        stack: error.stack,
        key,
        decrement
      });
      return null;
    }
  }

  /**
   * Set a value in the cache with expiration
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success flag
   */
  async setEx(key, value, ttl) {
    return this.set(key, value, { ttl });
  }

  /**
   * Get a value from the cache with a fallback function
   * @param {string} key - Cache key
   * @param {Function} fallback - Fallback function
   * @param {Object} options - Cache options
   * @returns {Promise<any>} - Cached or fallback value
   */
  async getOrSet(key, fallback, options = {}) {
    const { ttl = null, parse = true } = options;
    
    try {
      // Try to get from cache
      const cachedValue = await this.get(key, { parse });
      
      if (cachedValue !== null) {
        return cachedValue;
      }
      
      // If not in cache, execute fallback
      const value = await fallback();
      
      // Cache the result
      await this.set(key, value, { ttl });
      
      return value;
    } catch (error) {
      logger.error('Error in getOrSet cache operation', { 
        error: error.message, 
        stack: error.stack,
        key
      });
      
      // If cache operation fails, still try to execute fallback
      return await fallback();
    }
  }

  /**
   * Delete multiple keys from the cache
   * @param {Array<string>} keys - Cache keys
   * @returns {Promise<number>} - Number of deleted keys
   */
  async deleteMany(keys) {
    if (!keys || keys.length === 0) {
      return 0;
    }
    
    try {
      return await redisClient.del(...keys);
    } catch (error) {
      logger.error('Error deleting multiple cache keys', { 
        error: error.message, 
        stack: error.stack,
        keys
      });
      return 0;
    }
  }

  /**
   * Delete keys matching a pattern
   * @param {string} pattern - Key pattern
   * @returns {Promise<number>} - Number of deleted keys
   */
  async deleteByPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      
      if (!keys || keys.length === 0) {
        return 0;
      }
      
      return await redisClient.del(...keys);
    } catch (error) {
      logger.error('Error deleting cache keys by pattern', { 
        error: error.message, 
        stack: error.stack,
        pattern
      });
      return 0;
    }
  }
}

// Export singleton instance
module.exports = new CacheService();
