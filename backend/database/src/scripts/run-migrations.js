/**
 * Run Migrations Script
 * This script runs database migrations
 */

const { MigrationService, closeConnections, logger } = require('../index');

// Run migrations
async function runMigrations() {
  try {
    logger.info('Starting database migrations');
    
    await MigrationService.migrate();
    
    logger.info('Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database migrations failed', { 
      error: error.message, 
      stack: error.stack
    });
    process.exit(1);
  } finally {
    await closeConnections();
  }
}

// Run the script
runMigrations();
