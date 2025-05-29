require('dotenv').config();

const app = require('./app');
const { connect } = require('./config/database');
const { logger } = require('./utils/logger');
const { handleUnhandledRejection, handleUncaughtException } = require('./utils/error-handler');
const retentionService = require('./services/retention.service');

// Handle uncaught exceptions
handleUncaughtException();

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connect();
    logger.info('Database connected successfully');

    // Start retention cleanup scheduler
    if (process.env.NODE_ENV === 'production') {
      retentionService.scheduleCleanup(24); // Run cleanup every 24 hours
      logger.info('Retention cleanup scheduler started');
    }

    // Start HTTP server
    const PORT = process.env.PORT || 8007;
    const server = app.listen(PORT, () => {
      logger.info(`Voice Recording Service started successfully`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        pid: process.pid
      });
    });

    // Store server reference for graceful shutdown
    app.server = server;

    // Handle unhandled promise rejections
    handleUnhandledRejection(server);

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

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
