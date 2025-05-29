/**
 * ABDM Authentication Service
 * Handles authentication with ABDM Gateway
 */

const axios = require('axios');
const NodeCache = require('node-cache');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { logger } = require('../utils/logger');
const { AbdmError } = require('../middleware/error.middleware');

// Cache for storing access tokens
const tokenCache = new NodeCache({ stdTTL: 3500 }); // Set TTL slightly less than 1 hour (3600 seconds)

/**
 * Get access token for ABDM Gateway
 * @returns {Promise<string>} Access token
 */
const getAccessToken = async () => {
  try {
    // Check if token exists in cache
    const cachedToken = tokenCache.get('abdm_access_token');
    if (cachedToken) {
      logger.debug('Using cached ABDM access token');
      return cachedToken;
    }

    // Generate new token
    logger.info('Generating new ABDM access token');
    
    const response = await axios.post(config.abdm.authUrl, {
      clientId: config.abdm.clientId,
      clientSecret: config.abdm.clientSecret
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-CM-ID': 'sbx'
      }
    });

    if (!response.data || !response.data.accessToken) {
      throw new AbdmError('Failed to get access token from ABDM', response.data);
    }

    // Cache the token
    const token = response.data.accessToken;
    const expiresIn = response.data.expiresIn || 3600;
    tokenCache.set('abdm_access_token', token, expiresIn - 100); // Set TTL slightly less than expiry time
    
    return token;
  } catch (error) {
    logger.error('Error getting ABDM access token:', error);
    if (error instanceof AbdmError) {
      throw error;
    }
    throw new AbdmError('Failed to authenticate with ABDM Gateway', {
      message: error.message,
      response: error.response?.data
    });
  }
};

/**
 * Create authenticated ABDM API client
 * @returns {Object} Axios instance with authentication headers
 */
const createAbdmApiClient = async () => {
  const token = await getAccessToken();
  
  return axios.create({
    baseURL: config.abdm.baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-CM-ID': 'sbx',
      'X-Request-ID': uuidv4()
    }
  });
};

/**
 * Test ABDM connectivity
 * @returns {Promise<boolean>} Connection status
 */
const testConnectivity = async () => {
  try {
    const token = await getAccessToken();
    logger.info('ABDM connectivity test successful');
    return true;
  } catch (error) {
    logger.error('ABDM connectivity test failed:', error);
    return false;
  }
};

module.exports = {
  getAccessToken,
  createAbdmApiClient,
  testConnectivity
};
