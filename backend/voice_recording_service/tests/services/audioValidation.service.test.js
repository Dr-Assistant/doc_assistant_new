const audioValidationService = require('../../src/services/audioValidation.service');

describe('AudioValidationService', () => {
  describe('validateAudioFile', () => {
    it('should validate a valid audio file', async () => {
      const audioBuffer = createMockAudioBuffer(1000);
      const metadata = { duration: 120 };

      // Mock file-type detection
      const fileType = require('file-type');
      jest.spyOn(fileType, 'fromBuffer').mockResolvedValue({
        mime: 'audio/mpeg',
        ext: 'mp3'
      });

      const result = await audioValidationService.validateAudioFile(audioBuffer, metadata);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.fileInfo.mimeType).toBe('audio/mpeg');
      expect(result.fileInfo.duration).toBe(120);
    });

    it('should reject files that are too large', async () => {
      const largeBuffer = createMockAudioBuffer(200 * 1024 * 1024); // 200MB

      const fileType = require('file-type');
      jest.spyOn(fileType, 'fromBuffer').mockResolvedValue({
        mime: 'audio/mpeg',
        ext: 'mp3'
      });

      const result = await audioValidationService.validateAudioFile(largeBuffer);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum allowed size');
    });

    it('should reject unsupported file types', async () => {
      const audioBuffer = createMockAudioBuffer(1000);

      const fileType = require('file-type');
      jest.spyOn(fileType, 'fromBuffer').mockResolvedValue({
        mime: 'video/mp4',
        ext: 'mp4'
      });

      const result = await audioValidationService.validateAudioFile(audioBuffer);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('is not allowed');
    });

    it('should reject empty files', async () => {
      const emptyBuffer = Buffer.alloc(0);

      const result = await audioValidationService.validateAudioFile(emptyBuffer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File is empty');
    });

    it('should reject files with invalid duration', async () => {
      const audioBuffer = createMockAudioBuffer(1000);
      const metadata = { duration: 0.5 }; // Invalid duration (below minimum)

      const fileType = require('file-type');
      jest.spyOn(fileType, 'fromBuffer').mockResolvedValue({
        mime: 'audio/mpeg',
        ext: 'mp3'
      });

      const result = await audioValidationService.validateAudioFile(audioBuffer, metadata);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('below minimum');
    });

    it('should reject files with excessive duration', async () => {
      const audioBuffer = createMockAudioBuffer(1000);
      const metadata = { duration: 4000 }; // Exceeds max duration

      const fileType = require('file-type');
      jest.spyOn(fileType, 'fromBuffer').mockResolvedValue({
        mime: 'audio/mpeg',
        ext: 'mp3'
      });

      const result = await audioValidationService.validateAudioFile(audioBuffer, metadata);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum');
    });
  });

  describe('assessAudioQuality', () => {
    it('should assess quality based on bitrate', () => {
      const audioBuffer = createMockAudioBuffer(32000); // 32KB
      const metadata = { duration: 10 }; // 10 seconds

      const quality = audioValidationService.assessAudioQuality(audioBuffer, metadata);

      expect(quality).toBe('poor'); // 32KB / 10s = 3.2KB/s (below 8KB/s threshold)
    });

    it('should return poor quality for low bitrate', () => {
      const audioBuffer = createMockAudioBuffer(5000); // 5KB
      const metadata = { duration: 10 }; // 10 seconds

      const quality = audioValidationService.assessAudioQuality(audioBuffer, metadata);

      expect(quality).toBe('poor'); // 5KB / 10s = 0.5KB/s
    });

    it('should return excellent quality for high bitrate', () => {
      const audioBuffer = createMockAudioBuffer(100000); // 100KB
      const metadata = { duration: 1 }; // 1 second

      const quality = audioValidationService.assessAudioQuality(audioBuffer, metadata);

      expect(quality).toBe('excellent'); // 100KB / 1s = 100KB/s
    });
  });

  describe('validateAudioChunk', () => {
    it('should validate a valid audio chunk', () => {
      const chunk = createMockAudioBuffer(1000);
      const chunkInfo = { sequence: 0 };

      const result = audioValidationService.validateAudioChunk(chunk, chunkInfo);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject oversized chunks', () => {
      const largeChunk = createMockAudioBuffer(2 * 1024 * 1024); // 2MB

      const result = audioValidationService.validateAudioChunk(largeChunk);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum');
    });

    it('should reject empty chunks', () => {
      const emptyChunk = Buffer.alloc(0);

      const result = audioValidationService.validateAudioChunk(emptyChunk);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Chunk is empty');
    });
  });

  describe('getSupportedFormats', () => {
    it('should return array of supported MIME types', () => {
      const formats = audioValidationService.getSupportedFormats();

      expect(Array.isArray(formats)).toBe(true);
      expect(formats).toContain('audio/mpeg');
      expect(formats).toContain('audio/wav');
    });
  });

  describe('getValidationLimits', () => {
    it('should return validation limits object', () => {
      const limits = audioValidationService.getValidationLimits();

      expect(limits).toHaveProperty('maxFileSize');
      expect(limits).toHaveProperty('maxDuration');
      expect(limits).toHaveProperty('minDuration');
      expect(limits).toHaveProperty('allowedMimeTypes');
      expect(limits).toHaveProperty('qualityThreshold');
    });
  });
});
