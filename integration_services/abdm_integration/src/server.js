/**
 * ABDM Integration Service
 * Main server file
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { logger } = require('./utils/logger');
const config = require('./config');
const routes = require('./routes');
const { errorMiddleware } = require('./middleware/error.middleware');
const { testConnection, syncModels } = require('./models');

// Initialize express app
const app = express();

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'abdm-integration-service' });
});

// Apply routes
app.use('/api/abdm', routes);

// Error handling middleware
app.use(errorMiddleware);

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Sync models in development
    await syncModels();

    // Start server
    const PORT = config.port || 8101;
    app.listen(PORT, () => {
      logger.info(`ABDM Integration Service running on port ${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info('Database connection established');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app; // For testing
