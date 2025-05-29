/**
 * Seed Database Script
 * This script seeds the database with initial data
 */

const { pgPool, connectMongo, closeConnections, logger } = require('../index');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Seed data files
const SEED_DIR = path.join(__dirname, '../../seeds');
const PG_SEED_FILE = path.join(SEED_DIR, 'postgresql_seed.sql');
const MONGO_SEED_FILE = path.join(SEED_DIR, 'mongodb_seed.js');

// Seed PostgreSQL database
async function seedPostgres() {
  if (!fs.existsSync(PG_SEED_FILE)) {
    logger.info('PostgreSQL seed file not found, skipping');
    return;
  }
  
  const client = await pgPool.connect();
  
  try {
    logger.info('Seeding PostgreSQL database');
    
    const seedSql = fs.readFileSync(PG_SEED_FILE, 'utf8');
    
    await client.query('BEGIN');
    await client.query(seedSql);
    await client.query('COMMIT');
    
    logger.info('PostgreSQL database seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    
    logger.error('Error seeding PostgreSQL database', { 
      error: error.message, 
      stack: error.stack
    });
    
    throw error;
  } finally {
    client.release();
  }
}

// Seed MongoDB database
async function seedMongo() {
  if (!fs.existsSync(MONGO_SEED_FILE)) {
    logger.info('MongoDB seed file not found, skipping');
    return;
  }
  
  let client = null;
  
  try {
    logger.info('Seeding MongoDB database');
    
    // Connect to MongoDB
    await connectMongo();
    
    // Load and execute the seed script
    const seedScript = require(MONGO_SEED_FILE);
    
    // If the script exports a function, execute it
    if (typeof seedScript === 'function') {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dr_assistant';
      client = new MongoClient(mongoUri);
      await client.connect();
      
      const db = client.db();
      await seedScript(db);
    }
    
    logger.info('MongoDB database seeded successfully');
  } catch (error) {
    logger.error('Error seeding MongoDB database', { 
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

// Run the seed script
async function seedDatabase() {
  try {
    logger.info('Starting database seeding');
    
    // Create seeds directory if it doesn't exist
    if (!fs.existsSync(SEED_DIR)) {
      fs.mkdirSync(SEED_DIR, { recursive: true });
      logger.info('Created seeds directory');
    }
    
    // Seed PostgreSQL
    await seedPostgres();
    
    // Seed MongoDB
    await seedMongo();
    
    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed', { 
      error: error.message, 
      stack: error.stack
    });
    process.exit(1);
  } finally {
    await closeConnections();
  }
}

// Run the script
seedDatabase();
