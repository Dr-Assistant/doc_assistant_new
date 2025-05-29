const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { logger } = require('../utils/logger');

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.gridFSBucket = null;
  }

  async connect() {
    try {
      const mongoUri = process.env.NODE_ENV === 'test' 
        ? process.env.MONGODB_TEST_URI 
        : process.env.MONGODB_URI;

      if (!mongoUri) {
        throw new Error('MongoDB URI not provided');
      }

      // Connect to MongoDB
      this.connection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      // Initialize GridFS bucket for file storage
      this.gridFSBucket = new GridFSBucket(this.connection.connection.db, {
        bucketName: 'voice_recordings'
      });

      logger.info('Connected to MongoDB successfully', {
        database: this.connection.connection.name,
        host: this.connection.connection.host,
        port: this.connection.connection.port
      });

      // Handle connection events
      this.connection.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      this.connection.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      this.connection.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await this.connection.disconnect();
        this.connection = null;
        this.gridFSBucket = null;
        logger.info('Disconnected from MongoDB');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    if (!this.connection) {
      throw new Error('Database not connected');
    }
    return this.connection;
  }

  getGridFSBucket() {
    if (!this.gridFSBucket) {
      throw new Error('GridFS bucket not initialized');
    }
    return this.gridFSBucket;
  }

  async isConnected() {
    return this.connection && this.connection.connection.readyState === 1;
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = {
  connect: () => dbConnection.connect(),
  disconnect: () => dbConnection.disconnect(),
  getConnection: () => dbConnection.getConnection(),
  getGridFSBucket: () => dbConnection.getGridFSBucket(),
  isConnected: () => dbConnection.isConnected()
};
