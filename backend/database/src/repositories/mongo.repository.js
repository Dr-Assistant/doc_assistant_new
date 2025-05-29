/**
 * MongoDB Repository
 * This module provides a base class for MongoDB repositories
 */

const mongoose = require('mongoose');
const { connectMongo } = require('../config/database');
const { logger } = require('../utils/logger');

class MongoRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Ensure MongoDB is connected
   * @returns {Promise<void>}
   */
  async ensureConnection() {
    if (mongoose.connection.readyState !== 1) {
      await connectMongo();
    }
  }

  /**
   * Find all documents in the collection
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of documents
   */
  async findAll(options = {}) {
    const { 
      filter = {}, 
      projection = null, 
      sort = null, 
      limit = null, 
      skip = null,
      populate = null
    } = options;
    
    try {
      await this.ensureConnection();
      
      let query = this.model.find(filter);
      
      if (projection) {
        query = query.select(projection);
      }
      
      if (sort) {
        query = query.sort(sort);
      }
      
      if (skip !== null) {
        query = query.skip(skip);
      }
      
      if (limit !== null) {
        query = query.limit(limit);
      }
      
      if (populate) {
        if (Array.isArray(populate)) {
          populate.forEach(field => {
            query = query.populate(field);
          });
        } else {
          query = query.populate(populate);
        }
      }
      
      return await query.exec();
    } catch (error) {
      logger.error('Error finding documents', { 
        error: error.message, 
        stack: error.stack,
        collection: this.model.collection.name,
        filter
      });
      throw error;
    }
  }

  /**
   * Find a document by ID
   * @param {string} id - Document ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Document
   */
  async findById(id, options = {}) {
    const { projection = null, populate = null } = options;
    
    try {
      await this.ensureConnection();
      
      let query = this.model.findById(id);
      
      if (projection) {
        query = query.select(projection);
      }
      
      if (populate) {
        if (Array.isArray(populate)) {
          populate.forEach(field => {
            query = query.populate(field);
          });
        } else {
          query = query.populate(populate);
        }
      }
      
      return await query.exec();
    } catch (error) {
      logger.error('Error finding document by ID', { 
        error: error.message, 
        stack: error.stack,
        collection: this.model.collection.name,
        id
      });
      throw error;
    }
  }

  /**
   * Find a document by a specific field
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Document
   */
  async findOne(filter, options = {}) {
    const { projection = null, populate = null } = options;
    
    try {
      await this.ensureConnection();
      
      let query = this.model.findOne(filter);
      
      if (projection) {
        query = query.select(projection);
      }
      
      if (populate) {
        if (Array.isArray(populate)) {
          populate.forEach(field => {
            query = query.populate(field);
          });
        } else {
          query = query.populate(populate);
        }
      }
      
      return await query.exec();
    } catch (error) {
      logger.error('Error finding document', { 
        error: error.message, 
        stack: error.stack,
        collection: this.model.collection.name,
        filter
      });
      throw error;
    }
  }

  /**
   * Create a new document
   * @param {Object} data - Document data
   * @returns {Promise<Object>} - Created document
   */
  async create(data) {
    try {
      await this.ensureConnection();
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      logger.error('Error creating document', { 
        error: error.message, 
        stack: error.stack,
        collection: this.model.collection.name
      });
      throw error;
    }
  }

  /**
   * Update a document by ID
   * @param {string} id - Document ID
   * @param {Object} data - Document data
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Updated document
   */
  async update(id, data, options = {}) {
    const { new: returnNew = true } = options;
    
    try {
      await this.ensureConnection();
      return await this.model.findByIdAndUpdate(id, data, { new: returnNew });
    } catch (error) {
      logger.error('Error updating document', { 
        error: error.message, 
        stack: error.stack,
        collection: this.model.collection.name,
        id
      });
      throw error;
    }
  }

  /**
   * Delete a document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object>} - Deleted document
   */
  async delete(id) {
    try {
      await this.ensureConnection();
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      logger.error('Error deleting document', { 
        error: error.message, 
        stack: error.stack,
        collection: this.model.collection.name,
        id
      });
      throw error;
    }
  }

  /**
   * Count documents
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>} - Document count
   */
  async count(filter = {}) {
    try {
      await this.ensureConnection();
      return await this.model.countDocuments(filter);
    } catch (error) {
      logger.error('Error counting documents', { 
        error: error.message, 
        stack: error.stack,
        collection: this.model.collection.name,
        filter
      });
      throw error;
    }
  }

  /**
   * Execute an aggregation pipeline
   * @param {Array} pipeline - Aggregation pipeline
   * @returns {Promise<Array>} - Aggregation results
   */
  async aggregate(pipeline) {
    try {
      await this.ensureConnection();
      return await this.model.aggregate(pipeline).exec();
    } catch (error) {
      logger.error('Error executing aggregation', { 
        error: error.message, 
        stack: error.stack,
        collection: this.model.collection.name,
        pipeline
      });
      throw error;
    }
  }
}

module.exports = MongoRepository;
