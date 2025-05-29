const fileType = require('file-type');
const { logger } = require('../utils/logger');
const { ValidationError } = require('../utils/error-handler');

class AudioValidationService {
  constructor() {
    this.allowedMimeTypes = (process.env.ALLOWED_MIME_TYPES || 'audio/mpeg,audio/wav,audio/mp4,audio/webm,audio/ogg').split(',');
    this.maxFileSize = this.parseFileSize(process.env.MAX_FILE_SIZE || '100MB');
    this.maxDuration = parseInt(process.env.MAX_DURATION || '3600'); // seconds
    this.minDuration = parseInt(process.env.MIN_DURATION || '1'); // seconds
    this.qualityThreshold = parseFloat(process.env.QUALITY_THRESHOLD || '0.7');
  }

  /**
   * Parse file size string to bytes
   * @param {string} sizeStr - Size string like "100MB"
   * @returns {number} Size in bytes
   */
  parseFileSize(sizeStr) {
    const units = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!match) {
      throw new Error('Invalid file size format');
    }

    const [, size, unit] = match;
    return parseFloat(size) * units[unit.toUpperCase()];
  }

  /**
   * Validate audio file
   * @param {Buffer} buffer - Audio file buffer
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} Validation result
   */
  async validateAudioFile(buffer, metadata = {}) {
    try {
      const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        fileInfo: {},
        quality: 'unknown'
      };

      // Check file size
      if (buffer.length > this.maxFileSize) {
        validation.isValid = false;
        validation.errors.push(`File size ${buffer.length} exceeds maximum allowed size ${this.maxFileSize}`);
      }

      if (buffer.length === 0) {
        validation.isValid = false;
        validation.errors.push('File is empty');
        return validation;
      }

      // Detect file type
      const detectedType = await fileType.fromBuffer(buffer);
      if (!detectedType) {
        validation.isValid = false;
        validation.errors.push('Unable to detect file type');
        return validation;
      }

      validation.fileInfo = {
        mimeType: detectedType.mime,
        extension: detectedType.ext,
        size: buffer.length
      };

      // Check MIME type
      if (!this.allowedMimeTypes.includes(detectedType.mime)) {
        validation.isValid = false;
        validation.errors.push(`File type ${detectedType.mime} is not allowed`);
      }

      // Validate duration if provided
      if (metadata.duration) {
        if (metadata.duration < this.minDuration) {
          validation.isValid = false;
          validation.errors.push(`Duration ${metadata.duration}s is below minimum ${this.minDuration}s`);
        }

        if (metadata.duration > this.maxDuration) {
          validation.isValid = false;
          validation.errors.push(`Duration ${metadata.duration}s exceeds maximum ${this.maxDuration}s`);
        }

        validation.fileInfo.duration = metadata.duration;
      }

      // Basic audio quality assessment
      validation.quality = this.assessAudioQuality(buffer, metadata);

      if (validation.quality === 'poor') {
        validation.warnings.push('Audio quality appears to be poor');
      }

      logger.info('Audio file validation completed', {
        isValid: validation.isValid,
        fileSize: buffer.length,
        mimeType: detectedType.mime,
        quality: validation.quality,
        errors: validation.errors.length,
        warnings: validation.warnings.length
      });

      return validation;
    } catch (error) {
      logger.error('Audio validation failed:', error);
      throw new ValidationError('Failed to validate audio file');
    }
  }

  /**
   * Assess audio quality based on file characteristics
   * @param {Buffer} buffer - Audio file buffer
   * @param {Object} metadata - File metadata
   * @returns {string} Quality assessment
   */
  assessAudioQuality(buffer, metadata) {
    try {
      // Basic quality assessment based on file size and duration
      if (metadata.duration && buffer.length) {
        const bytesPerSecond = buffer.length / metadata.duration;
        
        // Rough quality thresholds (these are simplified)
        if (bytesPerSecond < 8000) { // < 64 kbps
          return 'poor';
        } else if (bytesPerSecond < 16000) { // < 128 kbps
          return 'low';
        } else if (bytesPerSecond < 32000) { // < 256 kbps
          return 'medium';
        } else if (bytesPerSecond < 64000) { // < 512 kbps
          return 'high';
        } else {
          return 'excellent';
        }
      }

      // If no duration provided, assess based on file size only
      if (buffer.length < 100000) { // < 100KB
        return 'poor';
      } else if (buffer.length < 500000) { // < 500KB
        return 'low';
      } else if (buffer.length < 2000000) { // < 2MB
        return 'medium';
      } else if (buffer.length < 10000000) { // < 10MB
        return 'high';
      } else {
        return 'excellent';
      }
    } catch (error) {
      logger.warn('Quality assessment failed:', error);
      return 'unknown';
    }
  }

  /**
   * Validate audio chunk for streaming upload
   * @param {Buffer} chunk - Audio chunk buffer
   * @param {Object} chunkInfo - Chunk information
   * @returns {Object} Validation result
   */
  validateAudioChunk(chunk, chunkInfo = {}) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check chunk size
    const maxChunkSize = parseInt(process.env.CHUNK_SIZE || '1048576'); // 1MB default
    if (chunk.length > maxChunkSize) {
      validation.isValid = false;
      validation.errors.push(`Chunk size ${chunk.length} exceeds maximum ${maxChunkSize}`);
    }

    if (chunk.length === 0) {
      validation.isValid = false;
      validation.errors.push('Chunk is empty');
    }

    // Validate chunk sequence if provided
    if (chunkInfo.sequence !== undefined && chunkInfo.sequence < 0) {
      validation.isValid = false;
      validation.errors.push('Invalid chunk sequence number');
    }

    return validation;
  }

  /**
   * Get supported audio formats
   * @returns {Array} Array of supported MIME types
   */
  getSupportedFormats() {
    return [...this.allowedMimeTypes];
  }

  /**
   * Get validation limits
   * @returns {Object} Validation limits
   */
  getValidationLimits() {
    return {
      maxFileSize: this.maxFileSize,
      maxDuration: this.maxDuration,
      minDuration: this.minDuration,
      allowedMimeTypes: this.allowedMimeTypes,
      qualityThreshold: this.qualityThreshold
    };
  }
}

module.exports = new AudioValidationService();
