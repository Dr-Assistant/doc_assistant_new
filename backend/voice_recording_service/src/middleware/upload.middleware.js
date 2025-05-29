const multer = require('multer');
const { logger } = require('../utils/logger');
const { ValidationError } = require('../utils/error-handler');

/**
 * Configure multer for audio file uploads
 */
const configureMulter = () => {
  // Parse file size from environment
  const parseFileSize = (sizeStr) => {
    const units = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!match) {
      return 100 * 1024 * 1024; // Default 100MB
    }

    const [, size, unit] = match;
    return parseFloat(size) * units[unit.toUpperCase()];
  };

  const maxFileSize = parseFileSize(process.env.MAX_FILE_SIZE || '100MB');
  const allowedMimeTypes = (process.env.ALLOWED_MIME_TYPES || 'audio/mpeg,audio/wav,audio/mp4,audio/webm,audio/ogg').split(',');

  // Use memory storage for processing
  const storage = multer.memoryStorage();

  // File filter
  const fileFilter = (req, file, cb) => {
    logger.debug('File upload filter check', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      const error = new ValidationError(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`);
      return cb(error, false);
    }

    // Check field name
    if (file.fieldname !== 'audio') {
      const error = new ValidationError('File must be uploaded in "audio" field');
      return cb(error, false);
    }

    cb(null, true);
  };

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: 1, // Only one file at a time
      fields: 10, // Allow additional form fields
      fieldNameSize: 100,
      fieldSize: 1024 * 1024 // 1MB for form fields
    }
  });
};

/**
 * Single audio file upload middleware
 */
const uploadSingle = configureMulter().single('audio');

/**
 * Multiple audio files upload middleware (for chunked uploads)
 */
const uploadMultiple = configureMulter().array('audio', 10);

/**
 * Handle multer errors
 */
const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    logger.error('Multer upload error:', error);

    let message = 'File upload error';
    let statusCode = 400;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${process.env.MAX_FILE_SIZE || '100MB'}`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'MISSING_FIELD_NAME':
        message = 'Missing field name';
        break;
      default:
        message = error.message || 'File upload error';
    }

    return res.status(statusCode).json({
      success: false,
      error: {
        message: message,
        code: error.code
      }
    });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }

  // Pass other errors to the general error handler
  next(error);
};

/**
 * Validate uploaded file middleware
 */
const validateUploadedFile = (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('No audio file uploaded');
    }

    const file = req.file;

    // Additional validation
    if (!file.buffer || file.buffer.length === 0) {
      throw new ValidationError('Uploaded file is empty');
    }

    // Log file info
    logger.info('File uploaded successfully', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      fieldname: file.fieldname
    });

    // Add file info to request for easy access
    req.fileInfo = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer
    };

    next();
  } catch (error) {
    logger.error('File validation failed:', error);
    next(error);
  }
};

/**
 * Validate chunked upload middleware
 */
const validateChunkedUpload = (req, res, next) => {
  try {
    const { chunkIndex, totalChunks, uploadId } = req.body;

    if (!uploadId) {
      throw new ValidationError('Upload ID is required for chunked upload');
    }

    if (chunkIndex === undefined || totalChunks === undefined) {
      throw new ValidationError('Chunk index and total chunks are required');
    }

    const chunkIndexNum = parseInt(chunkIndex);
    const totalChunksNum = parseInt(totalChunks);

    if (isNaN(chunkIndexNum) || isNaN(totalChunksNum)) {
      throw new ValidationError('Chunk index and total chunks must be numbers');
    }

    if (chunkIndexNum < 0 || chunkIndexNum >= totalChunksNum) {
      throw new ValidationError('Invalid chunk index');
    }

    if (totalChunksNum <= 0 || totalChunksNum > 1000) {
      throw new ValidationError('Invalid total chunks count');
    }

    req.chunkInfo = {
      index: chunkIndexNum,
      total: totalChunksNum,
      uploadId: uploadId,
      isLastChunk: chunkIndexNum === totalChunksNum - 1
    };

    next();
  } catch (error) {
    logger.error('Chunked upload validation failed:', error);
    next(error);
  }
};

/**
 * Create upload middleware with custom configuration
 */
const createUploadMiddleware = (options = {}) => {
  const {
    maxFileSize = process.env.MAX_FILE_SIZE || '100MB',
    allowedMimeTypes = process.env.ALLOWED_MIME_TYPES || 'audio/mpeg,audio/wav,audio/mp4,audio/webm,audio/ogg',
    fieldName = 'audio'
  } = options;

  const parseFileSize = (sizeStr) => {
    const units = { 'B': 1, 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024 };
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!match) return 100 * 1024 * 1024;
    const [, size, unit] = match;
    return parseFloat(size) * units[unit.toUpperCase()];
  };

  const storage = multer.memoryStorage();
  const mimeTypes = allowedMimeTypes.split(',');

  const fileFilter = (req, file, cb) => {
    if (!mimeTypes.includes(file.mimetype)) {
      return cb(new ValidationError(`File type ${file.mimetype} is not allowed`), false);
    }
    if (file.fieldname !== fieldName) {
      return cb(new ValidationError(`File must be uploaded in "${fieldName}" field`), false);
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: parseFileSize(maxFileSize),
      files: 1,
      fields: 10,
      fieldNameSize: 100,
      fieldSize: 1024 * 1024
    }
  });
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadErrors,
  validateUploadedFile,
  validateChunkedUpload,
  createUploadMiddleware
};
