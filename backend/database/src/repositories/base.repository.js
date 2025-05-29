/**
 * Base Repository
 * This module provides a base class for PostgreSQL repositories
 */

const { pgPool, getPgClient } = require('../config/database');
const { logger } = require('../utils/logger');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Execute a query with parameters
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Query result
   */
  async executeQuery(query, params = [], options = {}) {
    const { useTransaction = false, client = null } = options;
    let localClient = null;
    let result = null;
    
    try {
      // Use provided client or get a new one from the pool
      localClient = client || (useTransaction ? await getPgClient() : null);
      
      // If using transaction, begin transaction
      if (useTransaction && !client) {
        await localClient.query('BEGIN');
      }
      
      // Execute query
      if (localClient) {
        result = await localClient.query(query, params);
      } else {
        result = await pgPool.query(query, params);
      }
      
      // If using transaction and no client was provided, commit transaction
      if (useTransaction && !client) {
        await localClient.query('COMMIT');
      }
      
      return result;
    } catch (error) {
      // If using transaction and no client was provided, rollback transaction
      if (useTransaction && localClient && !client) {
        try {
          await localClient.query('ROLLBACK');
        } catch (rollbackError) {
          logger.error('Error rolling back transaction', { 
            error: rollbackError.message, 
            stack: rollbackError.stack,
            query,
            params
          });
        }
      }
      
      logger.error('Error executing query', { 
        error: error.message, 
        stack: error.stack,
        query,
        params
      });
      
      throw error;
    } finally {
      // Release client if it was created locally
      if (localClient && !client) {
        localClient.release();
      }
    }
  }

  /**
   * Find all records in the table
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of records
   */
  async findAll(options = {}) {
    const { 
      fields = '*', 
      where = '', 
      params = [], 
      orderBy = '', 
      limit = null, 
      offset = null,
      client = null
    } = options;
    
    let query = `SELECT ${fields} FROM ${this.tableName}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit !== null) {
      query += ` LIMIT ${limit}`;
    }
    
    if (offset !== null) {
      query += ` OFFSET ${offset}`;
    }
    
    const result = await this.executeQuery(query, params, { client });
    return result.rows;
  }

  /**
   * Find a record by ID
   * @param {string} id - Record ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Record
   */
  async findById(id, options = {}) {
    const { fields = '*', client = null } = options;
    
    const query = `SELECT ${fields} FROM ${this.tableName} WHERE id = $1`;
    const result = await this.executeQuery(query, [id], { client });
    
    return result.rows[0] || null;
  }

  /**
   * Find a record by a specific field
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Record
   */
  async findByField(field, value, options = {}) {
    const { fields = '*', client = null } = options;
    
    const query = `SELECT ${fields} FROM ${this.tableName} WHERE ${field} = $1`;
    const result = await this.executeQuery(query, [value], { client });
    
    return result.rows[0] || null;
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Created record
   */
  async create(data, options = {}) {
    const { client = null, useTransaction = false, returnFields = '*' } = options;
    
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING ${returnFields}
    `;
    
    const result = await this.executeQuery(query, values, { client, useTransaction });
    return result.rows[0];
  }

  /**
   * Update a record by ID
   * @param {string} id - Record ID
   * @param {Object} data - Record data
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Updated record
   */
  async update(id, data, options = {}) {
    const { client = null, useTransaction = false, returnFields = '*' } = options;
    
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE id = $${fields.length + 1}
      RETURNING ${returnFields}
    `;
    
    const result = await this.executeQuery(query, [...values, id], { client, useTransaction });
    return result.rows[0];
  }

  /**
   * Delete a record by ID
   * @param {string} id - Record ID
   * @param {Object} options - Query options
   * @returns {Promise<boolean>} - Success flag
   */
  async delete(id, options = {}) {
    const { client = null, useTransaction = false } = options;
    
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.executeQuery(query, [id], { client, useTransaction });
    
    return result.rowCount > 0;
  }

  /**
   * Count records
   * @param {Object} options - Query options
   * @returns {Promise<number>} - Record count
   */
  async count(options = {}) {
    const { where = '', params = [], client = null } = options;
    
    let query = `SELECT COUNT(*) FROM ${this.tableName}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    const result = await this.executeQuery(query, params, { client });
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Execute a transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<any>} - Transaction result
   */
  async transaction(callback) {
    const client = await getPgClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = BaseRepository;
