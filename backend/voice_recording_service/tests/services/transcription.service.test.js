const transcriptionService = require('../../src/services/transcription.service');
const Transcription = require('../../src/models/Transcription');
const VoiceRecording = require('../../src/models/VoiceRecording');
const audioStorageService = require('../../src/services/audioStorage.service');

// Mock Google Speech client
jest.mock('@google-cloud/speech', () => ({
  SpeechClient: jest.fn().mockImplementation(() => ({
    recognize: jest.fn(),
    longRunningRecognize: jest.fn()
  }))
}));

// Mock audio storage service
jest.mock('../../src/services/audioStorage.service', () => ({
  retrieveAudioFile: jest.fn()
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('TranscriptionService', () => {
  let mockVoiceRecording;
  let mockTranscription;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock voice recording
    mockVoiceRecording = {
      _id: '507f1f77bcf86cd799439011',
      encounterId: '123e4567-e89b-12d3-a456-426614174000',
      patientId: '123e4567-e89b-12d3-a456-426614174001',
      doctorId: '123e4567-e89b-12d3-a456-426614174002',
      duration: 30,
      mimeType: 'audio/wav',
      fileSize: 1024000
    };

    // Mock transcription
    mockTranscription = {
      _id: '507f1f77bcf86cd799439012',
      voiceRecordingId: mockVoiceRecording._id,
      encounterId: mockVoiceRecording.encounterId,
      patientId: mockVoiceRecording.patientId,
      doctorId: mockVoiceRecording.doctorId,
      status: 'pending',
      processingMetadata: {
        audioFormat: 'LINEAR16',
        sampleRate: 16000,
        languageCode: 'en-US',
        enableSpeakerDiarization: true,
        speakerCount: 2,
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true,
        model: 'latest_long',
        useEnhanced: true
      },
      markAsProcessing: jest.fn().mockResolvedValue(true),
      markAsCompleted: jest.fn().mockResolvedValue(true),
      markAsFailed: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };
  });

  describe('createTranscription', () => {
    it('should create a new transcription successfully', async () => {
      // Mock Transcription constructor and save
      const mockSave = jest.fn().mockResolvedValue(mockTranscription);
      jest.spyOn(Transcription.prototype, 'save').mockImplementation(mockSave);

      const result = await transcriptionService.createTranscription(mockVoiceRecording);

      expect(result).toBeDefined();
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle errors during transcription creation', async () => {
      // Mock save to throw error
      jest.spyOn(Transcription.prototype, 'save').mockRejectedValue(new Error('Database error'));

      await expect(transcriptionService.createTranscription(mockVoiceRecording))
        .rejects.toThrow('Failed to create transcription job');
    });
  });

  describe('getAudioConfig', () => {
    it('should return correct config for WAV files', () => {
      const config = transcriptionService.getAudioConfig('audio/wav');

      expect(config.encoding).toBe('LINEAR16');
      expect(config.languageCode).toBe('en-US');
      expect(config.enableAutomaticPunctuation).toBe(true);
    });

    it('should return correct config for MP3 files', () => {
      const config = transcriptionService.getAudioConfig('audio/mpeg');

      expect(config.encoding).toBe('MP3');
      expect(config.sampleRateHertz).toBe(44100);
    });

    it('should return correct config for WebM files', () => {
      const config = transcriptionService.getAudioConfig('audio/webm');

      expect(config.encoding).toBe('WEBM_OPUS');
      expect(config.sampleRateHertz).toBe(48000);
    });
  });

  describe('buildSpeechRequest', () => {
    it('should build correct speech request', () => {
      const audioBuffer = Buffer.from('fake audio data');
      const metadata = {
        audioFormat: 'LINEAR16',
        sampleRate: 16000,
        languageCode: 'en-US',
        enableSpeakerDiarization: true,
        speakerCount: 2,
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true,
        model: 'latest_long',
        useEnhanced: true
      };

      const request = transcriptionService.buildSpeechRequest(audioBuffer, metadata);

      expect(request.audio.content).toBe(audioBuffer.toString('base64'));
      expect(request.config.encoding).toBe('LINEAR16');
      expect(request.config.sampleRateHertz).toBe(16000);
      expect(request.config.languageCode).toBe('en-US');
      expect(request.config.enableAutomaticPunctuation).toBe(true);
      expect(request.config.enableWordTimeOffsets).toBe(true);
      expect(request.config.diarizationConfig).toBeDefined();
      expect(request.config.speechContexts).toBeDefined();
      expect(request.config.speechContexts[0].phrases).toContain('hypertension');
    });
  });

  describe('processWords', () => {
    it('should process words correctly', () => {
      const mockWords = [
        {
          word: 'hello',
          startTime: { seconds: 1, nanos: 500000000 },
          endTime: { seconds: 2, nanos: 0 },
          confidence: 0.95,
          speakerTag: 1
        },
        {
          word: 'world',
          startTime: { seconds: 2, nanos: 100000000 },
          endTime: { seconds: 2, nanos: 800000000 },
          confidence: 0.87,
          speakerTag: 1
        }
      ];

      const processedWords = transcriptionService.processWords(mockWords);

      expect(processedWords).toHaveLength(2);
      expect(processedWords[0]).toEqual({
        word: 'hello',
        startTime: 1.5,
        endTime: 2.0,
        confidence: 0.95,
        speakerTag: 1
      });
      expect(processedWords[1]).toEqual({
        word: 'world',
        startTime: 2.1,
        endTime: 2.8,
        confidence: 0.87,
        speakerTag: 1
      });
    });
  });

  describe('parseTime', () => {
    it('should parse time correctly', () => {
      const time1 = { seconds: 5, nanos: 500000000 };
      const time2 = { seconds: 10, nanos: 0 };
      const time3 = null;

      expect(transcriptionService.parseTime(time1)).toBe(5.5);
      expect(transcriptionService.parseTime(time2)).toBe(10.0);
      expect(transcriptionService.parseTime(time3)).toBe(0);
    });
  });

  describe('calculateQualityMetrics', () => {
    it('should calculate quality metrics correctly', () => {
      const words = [
        { confidence: 0.9, startTime: 1.0, endTime: 1.5 },
        { confidence: 0.8, startTime: 2.0, endTime: 2.5 }, // 0.5s gap (not counted as silence)
        { confidence: 0.6, startTime: 3.5, endTime: 4.0 }, // 1.0s gap (counted as silence)
        { confidence: 0.95, startTime: 5.0, endTime: 5.5 } // 1.0s gap (counted as silence)
      ];

      const metrics = transcriptionService.calculateQualityMetrics(words, 'test transcript');

      expect(metrics.overallConfidence).toBeCloseTo(0.8125);
      expect(metrics.lowConfidenceWordCount).toBe(1); // confidence < 0.7
      expect(metrics.silenceDuration).toBeCloseTo(2.0); // two gaps > 0.5s: 1.0s + 1.0s
      expect(metrics.backgroundNoiseLevel).toBe('low'); // confidence > 0.8
    });

    it('should handle empty words array', () => {
      const metrics = transcriptionService.calculateQualityMetrics([], 'test');

      expect(metrics.overallConfidence).toBe(0);
      expect(metrics.lowConfidenceWordCount).toBe(0);
      expect(metrics.silenceDuration).toBe(0);
      expect(metrics.backgroundNoiseLevel).toBe('unknown');
    });
  });

  describe('detectMedicalTerms', () => {
    it('should detect medical terms in transcript', () => {
      const transcript = 'Patient has hypertension and diabetes. Blood pressure is elevated.';
      const words = [
        { word: 'Patient', startTime: 0, endTime: 0.5, confidence: 0.9 },
        { word: 'has', startTime: 0.5, endTime: 0.7, confidence: 0.9 },
        { word: 'hypertension', startTime: 0.7, endTime: 1.3, confidence: 0.95 },
        { word: 'and', startTime: 1.3, endTime: 1.4, confidence: 0.9 },
        { word: 'diabetes', startTime: 1.4, endTime: 2.0, confidence: 0.92 }
      ];

      const detectedTerms = transcriptionService.detectMedicalTerms(words, transcript);

      expect(detectedTerms.length).toBeGreaterThan(0);
      const hypertensionTerm = detectedTerms.find(term => term.term === 'hypertension');
      const diabetesTerm = detectedTerms.find(term => term.term === 'diabetes');

      expect(hypertensionTerm).toBeDefined();
      expect(diabetesTerm).toBeDefined();
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration from words', () => {
      const words = [
        { endTime: 1.5 },
        { endTime: 2.8 },
        { endTime: 4.2 }
      ];

      const duration = transcriptionService.calculateDuration(words);
      expect(duration).toBe(4.2);
    });

    it('should return 0 for empty words array', () => {
      const duration = transcriptionService.calculateDuration([]);
      expect(duration).toBe(0);
    });
  });
});
