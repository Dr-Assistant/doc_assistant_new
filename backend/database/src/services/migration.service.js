/**
 * Migration Service
 * This module provides functionality for database migrations
 */

const fs = require('fs');
const path = require('path');
const { pgPool } = require('../config/database');
const { logger } = require('../utils/logger');
const { MongoClient } = require('mongodb');

class MigrationService {
  constructor() {
    this.migrationsDir = path.join(__dirname, '../../migrations');
    this.pgMigrations = [];
    this.mongoMigrations = [];
  }

  /**
   * Initialize the migration service
   * @returns {Promise<void>}
   */
  async init() {
    // Load migration files
    await this.loadMigrations();
    
    // Create migrations table if it doesn't exist
    await this.createMigrationsTable();
  }

  /**
   * Load migration files
   * @returns {Promise<void>}
   */
  async loadMigrations() {
    try {
      const files = fs.readdirSync(this.migrationsDir);
      
      // Sort files to ensure they are executed in order
      files.sort();
      
      for (const file of files) {
        const filePath = path.join(this.migrationsDir, file);
        
        if (file.endsWith('.sql')) {
          // PostgreSQL migration
          const content = fs.readFileSync(filePath, 'utf8');
          const version = file.match(/^V(\d+)__/)?.[1];
          
          if (version) {
            this.pgMigrations.push({
              version: parseInt(version, 10),
              name: file,
              path: filePath,
              content
            });
          }
        } else if (file.endsWith('.js') && file.includes('mongodb')) {
          // MongoDB migration
          this.mongoMigrations.push({
            name: file,
            path: filePath
          });
        }
      }
      
      logger.info('Migrations loaded', { 
        pgMigrations: this.pgMigrations.length,
        mongoMigrations: this.mongoMigrations.length
      });
    } catch (error) {
      logger.error('Error loading migrations', { 
        error: error.message, 
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create migrations table if it doesn't exist
   * @returns {Promise<void>}
   */
  async createMigrationsTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          version INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;
      
      await pgPool.query(query);
      logger.info('Migrations table created or already exists');
    } catch (error) {
      logger.error('Error creating migrations table', { 
        error: error.message, 
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get applied migrations
   * @returns {Promise<Array>} - Applied migrations
   */
  async getAppliedMigrations() {
    try {
      const query = 'SELECT version, name, applied_at FROM migrations ORDER BY version ASC';
      const result = await pgPool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting applied migrations', { 
        error: error.message, 
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get pending PostgreSQL migrations
   * @returns {Promise<Array>} - Pending migrations
   */
  async getPendingPgMigrations() {
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = appliedMigrations.map(m => m.version);
    
    return this.pgMigrations.filter(m => !appliedVersions.includes(m.version));
  }

  /**
   * Apply a PostgreSQL migration
   * @param {Object} migration - Migration object
   * @returns {Promise<void>}
   */
  async applyPgMigration(migration) {
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Apply migration
      await client.query(migration.content);
      
      // Record migration
      await client.query(
        'INSERT INTO migrations (version, name) VALUES ($1, $2)',
        [migration.version, migration.name]
      );
      
      await client.query('COMMIT');
      
      logger.info('Migration applied successfully', { 
        version: migration.version,
        name: migration.name
      });
    } catch (error) {
      await client.query('ROLLBACK');
      
      logger.error('Error applying migration', { 
        error: error.message, 
        stack: error.stack,
        version: migration.version,
        name: migration.name
      });
      
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Apply MongoDB migrations
   * @param {string} mongoUri - MongoDB connection URI
   * @returns {Promise<void>}
   */
  async applyMongoMigrations(mongoUri) {
    if (this.mongoMigrations.length === 0) {
      logger.info('No MongoDB migrations to apply');
      return;
    }
    
    let client = null;
    
    try {
      client = new MongoClient(mongoUri);
      await client.connect();
      
      const db = client.db();
      
      for (const migration of this.mongoMigrations) {
        logger.info('Applying MongoDB migration', { name: migration.name });
        
        // Load and execute the migration script
        const script = require(migration.path);
        
        // If the script exports a function, execute it with the db instance
        if (typeof script === 'function') {
          await script(db);
        }
        
        logger.info('MongoDB migration applied successfully', { name: migration.name });
      }
    } catch (error) {
      logger.error('Error applying MongoDB migrations', { 
        error: error.message, 
        stack: error.stack
      });
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  /**
   * Run all pending migrations
   * @param {Object} options - Migration options
   * @returns {Promise<void>}
   */
  async migrate(options = {}) {
    const { mongoUri = process.env.MONGODB_URI } = options;
    
    try {
      await this.init();
      
      // Apply PostgreSQL migrations
      const pendingPgMigrations = await this.getPendingPgMigrations();
      
      if (pendingPgMigrations.length === 0) {
        logger.info('No pending PostgreSQL migrations');
      } else {
        logger.info('Applying PostgreSQL migrations', { count: pendingPgMigrations.length });
        
        for (const migration of pendingPgMigrations) {
          await this.applyPgMigration(migration);
        }
        
        logger.info('PostgreSQL migrations completed successfully');
      }
      
      // Apply MongoDB migrations
      if (mongoUri) {
        await this.applyMongoMigrations(mongoUri);
      } else {
        logger.warn('MongoDB URI not provided, skipping MongoDB migrations');
      }
      
      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed', { 
        error: error.message, 
        stack: error.stack
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new MigrationService();
