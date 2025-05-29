/**
 * ABDM Connectivity Test Script
 * 
 * This script tests connectivity with the ABDM Gateway
 * Run with: node src/scripts/test-connectivity.js
 */

require('dotenv').config();
const { testConnectivity } = require('../services/abdm-auth.service');
const { logger } = require('../utils/logger');

async function main() {
  logger.info('Testing ABDM Gateway connectivity...');
  
  try {
    const isConnected = await testConnectivity();
    
    if (isConnected) {
      logger.info('✅ Successfully connected to ABDM Gateway');
      logger.info('ABDM Sandbox environment is properly configured');
    } else {
      logger.error('❌ Failed to connect to ABDM Gateway');
      logger.error('Please check your credentials and network connectivity');
    }
  } catch (error) {
    logger.error('❌ Error testing ABDM connectivity:', error);
  }
}

// Run the test
main().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
