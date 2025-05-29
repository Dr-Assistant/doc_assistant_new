const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { Token } = require('../models');
const { AuthenticationError } = require('./error-handler');
const { logger } = require('./logger');

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} secret - JWT secret
 * @param {Object} options - JWT options
 * @returns {string} JWT token
 */
const generateToken = (payload, secret, options) => {
  return jwt.sign(payload, secret, options);
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret
 * @returns {Object} Decoded token
 */
const verifyToken = (token, secret) => {
  try {
    // Use a fallback secret if the provided secret is not set
    const jwtSecret = secret || process.env.JWT_SECRET || 'dev_jwt_secret_key_for_dr_assistant';

    // Log the secret being used (for debugging)
    logger.debug(`Verifying token with secret: ${jwtSecret ? 'Secret is set' : 'Secret is NOT set'}`);

    return jwt.verify(token, jwtSecret);
  } catch (error) {
    logger.error(`Token verification failed: ${error.message}`);
    throw new AuthenticationError('Invalid token');
  }
};

/**
 * Generate access token
 * @param {Object} user - User object
 * @returns {string} Access token
 */
const generateAccessToken = (user) => {
  const payload = {
    sub: user.id,
    name: user.full_name,
    role: user.role,
    type: 'access',
    jti: uuidv4()
  };

  // Use a fallback secret if environment variable is not set
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_for_dr_assistant';

  // Log the secret being used (for debugging)
  logger.debug(`Using JWT secret: ${secret ? 'Secret is set' : 'Secret is NOT set'}`);

  return generateToken(
    payload,
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @param {string} [tokenFamily] - Token family for refresh token rotation
 * @param {Object} [deviceInfo] - Device information
 * @param {string} [ipAddress] - IP address
 * @returns {Object} Refresh token object
 */
const generateRefreshToken = async (user, tokenFamily = null, deviceInfo = {}, ipAddress = null) => {
  // Generate a random token
  const refreshToken = crypto.randomBytes(40).toString('hex');

  // Calculate expiration date
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  const expiresInMs = ms(expiresIn);
  const expires = new Date(Date.now() + expiresInMs);

  // Create a new token family if not provided
  const family = tokenFamily || uuidv4();

  // Save token to database
  const tokenDoc = await Token.create({
    userId: user.id,
    token: refreshToken,
    type: 'refresh',
    expires,
    family,
    device_info: deviceInfo,
    ip_address: ipAddress,
    last_used_at: new Date()
  });

  return {
    token: refreshToken,
    expires,
    family,
    id: tokenDoc.id
  };
};

/**
 * Rotate refresh token
 * @param {string} oldRefreshToken - Old refresh token
 * @param {Object} [deviceInfo] - Device information
 * @param {string} [ipAddress] - IP address
 * @returns {Object} New refresh token object
 */
const rotateRefreshToken = async (oldRefreshToken, deviceInfo = {}, ipAddress = null) => {
  // Find the old token
  const oldToken = await Token.findOne({ where: { token: oldRefreshToken, type: 'refresh' } });

  if (!oldToken) {
    throw new AuthenticationError('Invalid refresh token');
  }

  // Check if token is expired
  if (new Date() > oldToken.expires) {
    throw new AuthenticationError('Refresh token expired');
  }

  // Check if token is blacklisted
  if (oldToken.blacklisted) {
    // Blacklist all tokens in the family (potential token theft)
    await Token.update(
      { blacklisted: true },
      { where: { family: oldToken.family } }
    );

    throw new AuthenticationError('Refresh token has been revoked');
  }

  // Get user
  const user = await oldToken.getUser();

  // Blacklist the old token
  await oldToken.update({ blacklisted: true });

  // Generate new refresh token with the same family
  return generateRefreshToken(user, oldToken.family, deviceInfo, ipAddress);
};

/**
 * Revoke all refresh tokens for a user
 * @param {string} userId - User ID
 * @returns {number} Number of tokens revoked
 */
const revokeAllUserTokens = async (userId) => {
  const result = await Token.update(
    { blacklisted: true },
    { where: { userId, type: 'refresh', blacklisted: false } }
  );

  return result[0]; // Number of rows affected
};

/**
 * Revoke a specific refresh token
 * @param {string} token - Refresh token
 * @returns {boolean} True if token was revoked
 */
const revokeRefreshToken = async (token) => {
  const result = await Token.update(
    { blacklisted: true },
    { where: { token, type: 'refresh', blacklisted: false } }
  );

  return result[0] > 0;
};

/**
 * Helper function to parse ms from string like '7d', '15m', etc.
 * @param {string} str - Time string
 * @returns {number} Milliseconds
 */
function ms(str) {
  const match = str.match(/^(\d+)([smhdwy])$/);
  if (!match) return 0;

  const num = parseInt(match[1]);
  const type = match[2];

  switch (type) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    case 'w': return num * 7 * 24 * 60 * 60 * 1000;
    case 'y': return num * 365 * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

module.exports = {
  generateToken,
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeAllUserTokens,
  revokeRefreshToken,
  ms
};
