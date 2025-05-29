const crypto = require('crypto');
const { logger } = require('./logger');

class EncryptionService {
  constructor() {
    this.algorithm = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
    this.key = this.getEncryptionKey();
  }

  getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('Encryption key not provided in environment variables');
    }
    
    if (key.length !== 32) {
      throw new Error('Encryption key must be 32 characters long');
    }
    
    return Buffer.from(key, 'utf8');
  }

  /**
   * Encrypt data
   * @param {Buffer|string} data - Data to encrypt
   * @returns {Object} Encrypted data with IV and auth tag
   */
  encrypt(data) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.key);
      cipher.setAAD(Buffer.from('voice-recording', 'utf8'));

      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      const authTag = cipher.getAuthTag();

      return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
      };
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data
   * @param {Object} encryptedData - Object containing encrypted data, IV, and auth tag
   * @returns {Buffer} Decrypted data
   */
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, authTag } = encryptedData;
      
      const decipher = crypto.createDecipher(this.algorithm, this.key);
      decipher.setAAD(Buffer.from('voice-recording', 'utf8'));
      decipher.setAuthTag(Buffer.from(authTag, 'base64'));

      let decrypted = decipher.update(Buffer.from(encrypted, 'base64'));
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Generate a secure hash for data integrity
   * @param {Buffer|string} data - Data to hash
   * @returns {string} SHA-256 hash
   */
  generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity using hash
   * @param {Buffer|string} data - Original data
   * @param {string} hash - Hash to verify against
   * @returns {boolean} True if hash matches
   */
  verifyHash(data, hash) {
    const computedHash = this.generateHash(data);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  }

  /**
   * Generate a secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} Random token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = new EncryptionService();
