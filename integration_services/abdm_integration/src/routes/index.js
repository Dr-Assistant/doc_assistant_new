/**
 * ABDM Integration Routes
 * Defines all API routes for ABDM integration
 */

const express = require('express');
const router = express.Router();
const { testConnectivity } = require('../services/abdm-auth.service');
const { logger } = require('../utils/logger');
const { verifyToken } = require('../middleware/auth.middleware');

// Import route modules
const consentRoutes = require('./consent.routes');
const healthRecordRoutes = require('./health-record.routes');

/**
 * @route GET /api/abdm/status
 * @desc Check ABDM connectivity status
 * @access Public
 */
router.get('/status', async (req, res, next) => {
  try {
    const isConnected = await testConnectivity();

    res.status(200).json({
      success: true,
      status: isConnected ? 'connected' : 'disconnected',
      message: isConnected ? 'Successfully connected to ABDM Gateway' : 'Failed to connect to ABDM Gateway'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/abdm/config
 * @desc Get ABDM configuration (non-sensitive)
 * @access Public
 */
router.get('/config', (req, res) => {
  res.status(200).json({
    success: true,
    config: {
      baseUrl: process.env.ABDM_BASE_URL,
      environment: process.env.NODE_ENV,
      consentCallbackUrl: process.env.CONSENT_CALLBACK_URL,
      healthRecordCallbackUrl: process.env.HEALTH_RECORD_CALLBACK_URL
    }
  });
});

/**
 * @route GET /api/abdm/protected
 * @desc Protected route example
 * @access Private
 */
router.get('/protected', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'You have access to this protected route',
    user: req.user
  });
});

// Mount route modules
router.use('/consent', consentRoutes);
router.use('/health-records', healthRecordRoutes);

// Export router
module.exports = router;
