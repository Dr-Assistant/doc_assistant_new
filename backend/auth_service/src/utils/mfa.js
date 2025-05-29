const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate a new TOTP secret
 * @param {string} username - User's username
 * @returns {Object} TOTP secret object
 */
const generateTOTPSecret = (username) => {
  return speakeasy.generateSecret({
    length: 20,
    name: `Dr. Assistant (${username})`,
    issuer: 'Dr. Assistant'
  });
};

/**
 * Generate a QR code for TOTP setup
 * @param {Object} secret - TOTP secret object
 * @returns {Promise<string>} QR code data URL
 */
const generateTOTPQRCode = async (secret) => {
  return QRCode.toDataURL(secret.otpauth_url);
};

/**
 * Verify a TOTP token
 * @param {string} token - TOTP token
 * @param {string} secret - TOTP secret (base32)
 * @returns {boolean} True if token is valid
 */
const verifyTOTP = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1 // Allow 1 step before/after for time drift
  });
};

/**
 * Generate backup codes
 * @param {number} [count=10] - Number of backup codes to generate
 * @param {number} [length=8] - Length of each backup code
 * @returns {Array<string>} Array of backup codes
 */
const generateBackupCodes = (count = 10, length = 8) => {
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a random code
    const code = crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length)
      .toUpperCase();
    
    // Format as XXXX-XXXX
    const formattedCode = code.slice(0, 4) + '-' + code.slice(4);
    
    codes.push(formattedCode);
  }
  
  return codes;
};

/**
 * Verify a backup code
 * @param {string} code - Backup code to verify
 * @param {Array<Object>} backupCodes - Array of backup code objects
 * @returns {Object|null} Used backup code object or null if invalid
 */
const verifyBackupCode = (code, backupCodes) => {
  // Normalize the code (remove dashes, uppercase)
  const normalizedCode = code.replace(/-/g, '').toUpperCase();
  
  // Find the backup code
  const backupCode = backupCodes.find(bc => 
    bc.code.replace(/-/g, '') === normalizedCode && !bc.used
  );
  
  return backupCode || null;
};

module.exports = {
  generateTOTPSecret,
  generateTOTPQRCode,
  verifyTOTP,
  generateBackupCodes,
  verifyBackupCode
};
