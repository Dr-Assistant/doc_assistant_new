/**
 * Routes Index
 * Main router for the Task Service
 */

const express = require('express');
const router = express.Router();

// Import route modules
const taskRoutes = require('./task.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'task-service',
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
router.use('/tasks', taskRoutes);

module.exports = router;
