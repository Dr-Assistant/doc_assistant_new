require('dotenv').config();
const app = require('./app');
const database = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 9002;

/**
 * Start the server
 */
async function startServer() {
  try {
    // Connect to database
    logger.info('Starting Clinical Note Generation Service...');
    
    await database.connect();
    logger.info('Database connected successfully');

    // Validate required environment variables
    validateEnvironment();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info('Clinical Note Generation Service started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
        pid: process.pid
      });
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await database.disconnect();
          logger.info('Database disconnected');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', { error: error.message });
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = [
    'MONGODB_URI',
    'GOOGLE_GEMINI_API_KEY',
    'JWT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate Gemini API key format (basic check)
  if (process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY.startsWith('AI')) {
    logger.warn('Google Gemini API key format may be incorrect');
  }

  logger.info('Environment validation passed');
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
