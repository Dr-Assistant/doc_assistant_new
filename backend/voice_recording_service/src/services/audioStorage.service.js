const { GridFSBucket, ObjectId } = require('mongodb');
const { Readable } = require('stream');
const { getGridFSBucket } = require('../config/database');
const encryptionService = require('../utils/encryption');
const { logger } = require('../utils/logger');
const { InternalServerError, NotFoundError } = require('../utils/error-handler');

class AudioStorageService {
  constructor() {
    this.bucketName = 'voice_recordings';
  }

  /**
   * Store audio file in GridFS with encryption
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} Storage result with file ID and encryption info
   */
  async storeAudioFile(audioBuffer, metadata) {
    try {
      const bucket = getGridFSBucket();

      // Generate encryption data
      const encryptionData = encryptionService.encrypt(audioBuffer);
      const checksum = encryptionService.generateHash(audioBuffer);

      // Create readable stream from encrypted buffer
      const encryptedBuffer = Buffer.from(encryptionData.encrypted, 'base64');
      const readableStream = new Readable();
      readableStream.push(encryptedBuffer);
      readableStream.push(null);

      // Prepare GridFS metadata
      const gridFSMetadata = {
        originalName: metadata.originalFileName || 'voice_recording',
        mimeType: metadata.mimeType,
        encounterId: metadata.encounterId,
        patientId: metadata.patientId,
        doctorId: metadata.doctorId,
        uploadedAt: new Date(),
        uploadedBy: metadata.uploadedBy,
        encrypted: true,
        checksum: checksum,
        originalSize: audioBuffer.length,
        encryptedSize: encryptedBuffer.length
      };

      // Upload to GridFS
      const uploadStream = bucket.openUploadStream(
        `voice_recording_${Date.now()}`,
        {
          metadata: gridFSMetadata,
          chunkSizeBytes: parseInt(process.env.CHUNK_SIZE || '1048576')
        }
      );

      return new Promise((resolve, reject) => {
        uploadStream.on('error', (error) => {
          logger.error('GridFS upload failed:', error);
          reject(new InternalServerError('Failed to store audio file'));
        });

        uploadStream.on('finish', () => {
          logger.info('Audio file stored successfully', {
            fileId: uploadStream.id,
            originalSize: audioBuffer.length,
            encryptedSize: encryptedBuffer.length,
            encounterId: metadata.encounterId
          });

          resolve({
            fileId: uploadStream.id,
            encryption: {
              algorithm: 'aes-256-gcm',
              keyId: encryptionService.generateToken(16),
              iv: encryptionData.iv,
              authTag: encryptionData.authTag
            },
            checksum: checksum,
            originalSize: audioBuffer.length,
            encryptedSize: encryptedBuffer.length
          });
        });

        readableStream.pipe(uploadStream);
      });
    } catch (error) {
      logger.error('Audio storage failed:', error);
      throw new InternalServerError('Failed to store audio file');
    }
  }

  /**
   * Retrieve and decrypt audio file from GridFS
   * @param {string} fileId - GridFS file ID
   * @returns {Promise<Object>} Decrypted audio buffer and metadata
   */
  async retrieveAudioFile(fileId) {
    try {
      const bucket = getGridFSBucket();

      // Get file metadata first
      const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
      if (files.length === 0) {
        throw new NotFoundError('Audio file not found');
      }

      const fileMetadata = files[0];

      // Download encrypted file
      const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
      const chunks = [];

      return new Promise((resolve, reject) => {
        downloadStream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        downloadStream.on('error', (error) => {
          logger.error('GridFS download failed:', error);
          reject(new InternalServerError('Failed to retrieve audio file'));
        });

        downloadStream.on('end', () => {
          try {
            const encryptedBuffer = Buffer.concat(chunks);

            // Note: In a real implementation, you would need to store and retrieve
            // the encryption IV and authTag from the voice recording document
            // For now, we'll return the encrypted buffer and metadata

            logger.info('Audio file retrieved successfully', {
              fileId: fileId,
              encryptedSize: encryptedBuffer.length,
              originalSize: fileMetadata.metadata.originalSize
            });

            resolve({
              encryptedBuffer: encryptedBuffer,
              metadata: fileMetadata.metadata,
              needsDecryption: true
            });
          } catch (error) {
            logger.error('Audio retrieval processing failed:', error);
            reject(new InternalServerError('Failed to process retrieved audio file'));
          }
        });
      });
    } catch (error) {
      logger.error('Audio retrieval failed:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve audio file');
    }
  }

  /**
   * Decrypt audio buffer using encryption data
   * @param {Buffer} encryptedBuffer - Encrypted audio buffer
   * @param {Object} encryptionData - Encryption metadata
   * @returns {Buffer} Decrypted audio buffer
   */
  decryptAudioBuffer(encryptedBuffer, encryptionData) {
    try {
      const decryptionData = {
        encrypted: encryptedBuffer.toString('base64'),
        iv: encryptionData.iv,
        authTag: encryptionData.authTag
      };

      return encryptionService.decrypt(decryptionData);
    } catch (error) {
      logger.error('Audio decryption failed:', error);
      throw new InternalServerError('Failed to decrypt audio file');
    }
  }

  /**
   * Delete audio file from GridFS
   * @param {string} fileId - GridFS file ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteAudioFile(fileId) {
    try {
      const bucket = getGridFSBucket();

      // Check if file exists
      const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
      if (files.length === 0) {
        throw new NotFoundError('Audio file not found');
      }

      // Delete file
      await bucket.delete(new ObjectId(fileId));

      logger.info('Audio file deleted successfully', { fileId });
      return true;
    } catch (error) {
      logger.error('Audio deletion failed:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to delete audio file');
    }
  }

  /**
   * Get file metadata without downloading the file
   * @param {string} fileId - GridFS file ID
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(fileId) {
    try {
      const bucket = getGridFSBucket();

      const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
      if (files.length === 0) {
        throw new NotFoundError('Audio file not found');
      }

      return files[0];
    } catch (error) {
      logger.error('Failed to get file metadata:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to get file metadata');
    }
  }

  /**
   * Store audio chunk for streaming upload
   * @param {Buffer} chunk - Audio chunk
   * @param {Object} chunkInfo - Chunk information
   * @returns {Promise<Object>} Chunk storage result
   */
  async storeAudioChunk(chunk, chunkInfo) {
    try {
      // For streaming uploads, we would typically store chunks temporarily
      // and then combine them when the upload is complete
      // This is a simplified implementation

      const encryptedChunk = encryptionService.encrypt(chunk);
      const chunkId = encryptionService.generateToken(16);

      // In a real implementation, you might store chunks in a temporary collection
      // or use a different storage mechanism for streaming

      logger.info('Audio chunk stored', {
        chunkId: chunkId,
        sequence: chunkInfo.sequence,
        size: chunk.length
      });

      return {
        chunkId: chunkId,
        sequence: chunkInfo.sequence,
        size: chunk.length,
        encrypted: true
      };
    } catch (error) {
      logger.error('Chunk storage failed:', error);
      throw new InternalServerError('Failed to store audio chunk');
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    try {
      const bucket = getGridFSBucket();

      // Get collection stats - use countDocuments instead of stats() to avoid auth issues
      const db = bucket.s.db;
      const filesCollection = db.collection(`${this.bucketName}.files`);
      const chunksCollection = db.collection(`${this.bucketName}.chunks`);

      const totalFiles = await filesCollection.countDocuments();
      const totalChunks = await chunksCollection.countDocuments();

      // Get basic size info without requiring admin privileges
      const sampleFiles = await filesCollection.find({}).limit(10).toArray();
      const averageFileSize = sampleFiles.length > 0
        ? sampleFiles.reduce((sum, file) => sum + (file.length || 0), 0) / sampleFiles.length
        : 0;

      return {
        totalFiles: totalFiles,
        totalSize: totalFiles * averageFileSize, // Estimated
        averageFileSize: averageFileSize,
        totalChunks: totalChunks,
        totalStorageSize: totalFiles * averageFileSize, // Estimated
        note: 'Statistics are estimated based on sample data'
      };
    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      // Return basic stats instead of throwing error
      return {
        totalFiles: 0,
        totalSize: 0,
        averageFileSize: 0,
        totalChunks: 0,
        totalStorageSize: 0,
        error: 'Unable to retrieve detailed statistics'
      };
    }
  }
}

module.exports = new AudioStorageService();
