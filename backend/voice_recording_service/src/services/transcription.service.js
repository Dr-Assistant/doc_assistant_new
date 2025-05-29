const speech = require('@google-cloud/speech');
const logger = require('../utils/logger');
const Transcription = require('../models/Transcription');
const audioStorageService = require('./audioStorage.service');
const { InternalServerError, ValidationError } = require('../utils/error-handler');

class TranscriptionService {
  constructor() {
    // Initialize Google Speech client
    this.speechClient = new speech.SpeechClient({
      // Credentials will be loaded from environment variables or service account file
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
    });

    // Medical terminology for enhanced recognition
    this.medicalTerms = [
      'hypertension', 'diabetes', 'pneumonia', 'bronchitis', 'asthma',
      'myocardial infarction', 'angina', 'arrhythmia', 'tachycardia', 'bradycardia',
      'dyspnea', 'orthopnea', 'edema', 'syncope', 'palpitations',
      'chest pain', 'shortness of breath', 'nausea', 'vomiting', 'diarrhea',
      'constipation', 'abdominal pain', 'headache', 'dizziness', 'fatigue',
      'fever', 'chills', 'cough', 'sputum', 'hemoptysis',
      'medication', 'prescription', 'dosage', 'milligrams', 'tablets',
      'blood pressure', 'heart rate', 'temperature', 'oxygen saturation',
      'electrocardiogram', 'ecg', 'ekg', 'x-ray', 'ct scan', 'mri'
    ];

    // Default transcription configuration
    this.defaultConfig = {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      enableSpeakerDiarization: true,
      diarizationSpeakerCount: 2,
      model: 'latest_long',
      useEnhanced: true,
      enableWordConfidence: true,
      maxAlternatives: 3
    };
  }

  /**
   * Create a new transcription job
   * @param {Object} voiceRecording - Voice recording document
   * @param {Object} options - Transcription options
   * @returns {Promise<Object>} Created transcription
   */
  async createTranscription(voiceRecording, options = {}) {
    try {
      logger.info('Creating transcription job', {
        voiceRecordingId: voiceRecording._id,
        encounterId: voiceRecording.encounterId
      });

      // Determine audio format and configuration
      const audioConfig = this.getAudioConfig(voiceRecording.mimeType, options);

      // Create transcription document
      const transcription = new Transcription({
        voiceRecordingId: voiceRecording._id,
        encounterId: voiceRecording.encounterId,
        patientId: voiceRecording.patientId,
        doctorId: voiceRecording.doctorId,
        status: 'pending',
        processingMetadata: {
          audioFormat: audioConfig.encoding,
          sampleRate: audioConfig.sampleRateHertz,
          channels: audioConfig.audioChannelCount || 1,
          languageCode: audioConfig.languageCode,
          enableSpeakerDiarization: audioConfig.enableSpeakerDiarization,
          speakerCount: audioConfig.diarizationSpeakerCount,
          enableAutomaticPunctuation: audioConfig.enableAutomaticPunctuation,
          enableWordTimeOffsets: audioConfig.enableWordTimeOffsets,
          model: audioConfig.model,
          useEnhanced: audioConfig.useEnhanced
        }
      });

      await transcription.save();

      logger.info('Transcription job created', {
        transcriptionId: transcription._id,
        voiceRecordingId: voiceRecording._id
      });

      return transcription;
    } catch (error) {
      logger.error('Failed to create transcription job', {
        error: error.message,
        voiceRecordingId: voiceRecording._id
      });
      throw new InternalServerError('Failed to create transcription job');
    }
  }

  /**
   * Process transcription using Google Speech-to-Text
   * @param {Object} transcription - Transcription document
   * @returns {Promise<Object>} Updated transcription
   */
  async processTranscription(transcription) {
    try {
      logger.info('Starting transcription processing', {
        transcriptionId: transcription._id,
        voiceRecordingId: transcription.voiceRecordingId
      });

      // Mark as processing
      await transcription.markAsProcessing();

      // Retrieve audio file
      const audioBuffer = await this.getAudioBuffer(transcription.voiceRecordingId);

      // Prepare Google Speech-to-Text request
      const request = this.buildSpeechRequest(audioBuffer, transcription.processingMetadata);

      // Call Google Speech-to-Text API
      const [response] = await this.speechClient.recognize(request);

      // Process the response
      const transcriptionData = this.processGoogleResponse(response, transcription);

      // Mark as completed and save results
      await transcription.markAsCompleted(transcriptionData);

      logger.info('Transcription processing completed', {
        transcriptionId: transcription._id,
        confidence: transcriptionData.confidence,
        wordCount: transcriptionData.wordCount
      });

      return transcription;
    } catch (error) {
      logger.error('Transcription processing failed', {
        transcriptionId: transcription._id,
        error: error.message,
        stack: error.stack
      });

      // Mark as failed
      await transcription.markAsFailed(error);
      throw error;
    }
  }

  /**
   * Process transcription using long-running operation (for longer audio files)
   * @param {Object} transcription - Transcription document
   * @returns {Promise<Object>} Updated transcription with job ID
   */
  async processLongRunningTranscription(transcription) {
    try {
      logger.info('Starting long-running transcription processing', {
        transcriptionId: transcription._id,
        voiceRecordingId: transcription.voiceRecordingId
      });

      // Mark as processing
      await transcription.markAsProcessing();

      // For long-running operations, we would typically upload to Google Cloud Storage first
      // For now, we'll use the regular recognize method with a timeout
      const audioBuffer = await this.getAudioBuffer(transcription.voiceRecordingId);
      const request = this.buildSpeechRequest(audioBuffer, transcription.processingMetadata);

      // Use longRunningRecognize for longer files
      const [operation] = await this.speechClient.longRunningRecognize(request);

      // Store the operation name for tracking
      transcription.googleJobId = operation.name;
      await transcription.save();

      logger.info('Long-running transcription job started', {
        transcriptionId: transcription._id,
        googleJobId: operation.name
      });

      // Poll for completion (in a real implementation, you might use webhooks)
      const [response] = await operation.promise();

      // Process the response
      const transcriptionData = this.processGoogleResponse(response, transcription);

      // Mark as completed and save results
      await transcription.markAsCompleted(transcriptionData);

      logger.info('Long-running transcription processing completed', {
        transcriptionId: transcription._id,
        confidence: transcriptionData.confidence,
        wordCount: transcriptionData.wordCount
      });

      return transcription;
    } catch (error) {
      logger.error('Long-running transcription processing failed', {
        transcriptionId: transcription._id,
        error: error.message
      });

      await transcription.markAsFailed(error);
      throw error;
    }
  }

  /**
   * Get audio configuration based on MIME type
   * @param {string} mimeType - Audio MIME type
   * @param {Object} options - Additional options
   * @returns {Object} Audio configuration
   */
  getAudioConfig(mimeType, options = {}) {
    const config = { ...this.defaultConfig, ...options };

    // Map MIME types to Google Speech encoding
    const encodingMap = {
      'audio/wav': 'LINEAR16',
      'audio/mpeg': 'MP3',
      'audio/mp4': 'MP3',
      'audio/webm': 'WEBM_OPUS',
      'audio/ogg': 'OGG_OPUS'
    };

    config.encoding = encodingMap[mimeType] || 'LINEAR16';

    // Adjust sample rate based on encoding
    if (config.encoding === 'WEBM_OPUS' || config.encoding === 'OGG_OPUS') {
      config.sampleRateHertz = 48000;
    } else if (config.encoding === 'MP3') {
      config.sampleRateHertz = 44100;
    }

    return config;
  }

  /**
   * Build Google Speech-to-Text request
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {Object} metadata - Processing metadata
   * @returns {Object} Speech request
   */
  buildSpeechRequest(audioBuffer, metadata) {
    const request = {
      audio: {
        content: audioBuffer.toString('base64')
      },
      config: {
        encoding: metadata.audioFormat,
        sampleRateHertz: metadata.sampleRate,
        languageCode: metadata.languageCode,
        enableAutomaticPunctuation: metadata.enableAutomaticPunctuation,
        enableWordTimeOffsets: metadata.enableWordTimeOffsets,
        enableWordConfidence: true,
        maxAlternatives: 3,
        model: metadata.model,
        useEnhanced: metadata.useEnhanced
      }
    };

    // Add speaker diarization if enabled
    if (metadata.enableSpeakerDiarization) {
      request.config.diarizationConfig = {
        enableSpeakerDiarization: true,
        minSpeakerCount: 1,
        maxSpeakerCount: metadata.speakerCount || 2
      };
    }

    // Add speech contexts for medical terminology
    request.config.speechContexts = [{
      phrases: this.medicalTerms,
      boost: 10.0
    }];

    return request;
  }

  /**
   * Retrieve audio buffer from storage
   * @param {string} voiceRecordingId - Voice recording ID
   * @returns {Promise<Buffer>} Audio buffer
   */
  async getAudioBuffer(voiceRecordingId) {
    try {
      const audioData = await audioStorageService.retrieveAudioFile(voiceRecordingId);
      return audioData.buffer;
    } catch (error) {
      logger.error('Failed to retrieve audio buffer', {
        voiceRecordingId,
        error: error.message
      });
      throw new InternalServerError('Failed to retrieve audio file for transcription');
    }
  }

  /**
   * Process Google Speech-to-Text response
   * @param {Object} response - Google Speech response
   * @param {Object} transcription - Transcription document
   * @returns {Object} Processed transcription data
   */
  processGoogleResponse(response, transcription) {
    if (!response.results || response.results.length === 0) {
      throw new ValidationError('No transcription results received from Google Speech-to-Text');
    }

    const results = response.results;
    const alternatives = [];
    const words = [];
    let transcript = '';
    let totalConfidence = 0;
    let speakerCount = 1;

    // Process each result
    results.forEach((result, index) => {
      if (result.alternatives && result.alternatives.length > 0) {
        const alternative = result.alternatives[0];

        // Build main transcript
        if (index === 0 || !transcript) {
          transcript = alternative.transcript;
          totalConfidence = alternative.confidence || 0;
        } else {
          transcript += ' ' + alternative.transcript;
        }

        // Store alternatives
        result.alternatives.forEach(alt => {
          alternatives.push({
            transcript: alt.transcript,
            confidence: alt.confidence || 0,
            words: this.processWords(alt.words || [])
          });
        });

        // Process words with timing and speaker information
        if (alternative.words) {
          const processedWords = this.processWords(alternative.words);
          words.push(...processedWords);

          // Count unique speakers
          const speakers = new Set(processedWords.map(w => w.speakerTag));
          speakerCount = Math.max(speakerCount, speakers.size);
        }
      }
    });

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(words, transcript);

    // Detect medical terms
    const medicalTermsDetected = this.detectMedicalTerms(words, transcript);

    return {
      transcript: transcript.trim(),
      alternatives: alternatives.slice(0, 3), // Keep top 3 alternatives
      words,
      confidence: totalConfidence,
      duration: this.calculateDuration(words),
      wordCount: transcript.split(/\s+/).filter(word => word.length > 0).length,
      speakerCount,
      qualityMetrics,
      medicalTermsDetected
    };
  }

  /**
   * Process words from Google Speech response
   * @param {Array} words - Raw words from Google Speech
   * @returns {Array} Processed words
   */
  processWords(words) {
    return words.map(word => ({
      word: word.word,
      startTime: this.parseTime(word.startTime),
      endTime: this.parseTime(word.endTime),
      confidence: word.confidence || 0,
      speakerTag: word.speakerTag || 0
    }));
  }

  /**
   * Parse time from Google Speech format
   * @param {Object} time - Time object from Google Speech
   * @returns {number} Time in seconds
   */
  parseTime(time) {
    if (!time) return 0;
    return parseFloat(time.seconds || 0) + (time.nanos || 0) / 1000000000;
  }

  /**
   * Calculate duration from words
   * @param {Array} words - Array of words with timing
   * @returns {number} Duration in seconds
   */
  calculateDuration(words) {
    if (!words || words.length === 0) return 0;
    const lastWord = words[words.length - 1];
    return lastWord.endTime || 0;
  }

  /**
   * Calculate quality metrics
   * @param {Array} words - Array of words
   * @param {string} transcript - Full transcript
   * @returns {Object} Quality metrics
   */
  calculateQualityMetrics(words, transcript) {
    if (!words || words.length === 0) {
      return {
        overallConfidence: 0,
        lowConfidenceWordCount: 0,
        silenceDuration: 0,
        backgroundNoiseLevel: 'unknown'
      };
    }

    const totalConfidence = words.reduce((sum, word) => sum + word.confidence, 0);
    const overallConfidence = totalConfidence / words.length;
    const lowConfidenceWordCount = words.filter(word => word.confidence < 0.7).length;

    // Calculate silence duration (gaps between words)
    let silenceDuration = 0;
    for (let i = 1; i < words.length; i++) {
      const gap = words[i].startTime - words[i - 1].endTime;
      if (gap > 0.5) { // Consider gaps > 0.5s as silence
        silenceDuration += gap;
      }
    }

    // Estimate background noise level based on confidence patterns
    let backgroundNoiseLevel = 'low';
    if (overallConfidence < 0.6) {
      backgroundNoiseLevel = 'high';
    } else if (overallConfidence < 0.8) {
      backgroundNoiseLevel = 'medium';
    }

    return {
      overallConfidence,
      lowConfidenceWordCount,
      silenceDuration,
      backgroundNoiseLevel
    };
  }

  /**
   * Detect medical terms in transcription
   * @param {Array} words - Array of words with timing
   * @param {string} transcript - Full transcript
   * @returns {Array} Detected medical terms
   */
  detectMedicalTerms(words, transcript) {
    const detectedTerms = [];
    const lowerTranscript = transcript.toLowerCase();

    this.medicalTerms.forEach(term => {
      const termLower = term.toLowerCase();
      let index = lowerTranscript.indexOf(termLower);

      while (index !== -1) {
        // Find corresponding words for timing
        const termWords = this.findWordsForTerm(words, transcript, index, term.length);

        if (termWords.length > 0) {
          detectedTerms.push({
            term: term,
            confidence: this.calculateTermConfidence(termWords),
            startTime: termWords[0].startTime,
            endTime: termWords[termWords.length - 1].endTime
          });
        }

        index = lowerTranscript.indexOf(termLower, index + 1);
      }
    });

    return detectedTerms;
  }

  /**
   * Find words corresponding to a medical term
   * @param {Array} words - Array of words
   * @param {string} transcript - Full transcript
   * @param {number} termIndex - Index of term in transcript
   * @param {number} termLength - Length of term
   * @returns {Array} Words corresponding to the term
   */
  findWordsForTerm(words, transcript, termIndex, termLength) {
    // This is a simplified implementation
    // In a real scenario, you'd need more sophisticated word alignment
    const termEnd = termIndex + termLength;
    const termWords = [];

    let currentIndex = 0;
    for (const word of words) {
      const wordStart = transcript.toLowerCase().indexOf(word.word.toLowerCase(), currentIndex);
      const wordEnd = wordStart + word.word.length;

      if (wordStart >= termIndex && wordEnd <= termEnd) {
        termWords.push(word);
      }

      currentIndex = wordEnd;
    }

    return termWords;
  }

  /**
   * Calculate confidence for a medical term
   * @param {Array} termWords - Words that make up the term
   * @returns {number} Average confidence
   */
  calculateTermConfidence(termWords) {
    if (termWords.length === 0) return 0;
    const totalConfidence = termWords.reduce((sum, word) => sum + word.confidence, 0);
    return totalConfidence / termWords.length;
  }

  /**
   * Retry failed transcription
   * @param {string} transcriptionId - Transcription ID
   * @returns {Promise<Object>} Updated transcription
   */
  async retryTranscription(transcriptionId) {
    try {
      const transcription = await Transcription.findById(transcriptionId);
      if (!transcription) {
        throw new ValidationError('Transcription not found');
      }

      if (transcription.status !== 'failed') {
        throw new ValidationError('Can only retry failed transcriptions');
      }

      // Check retry limit
      const maxRetries = parseInt(process.env.MAX_TRANSCRIPTION_RETRIES || '3');
      if (transcription.errorDetails?.retryCount >= maxRetries) {
        throw new ValidationError('Maximum retry attempts exceeded');
      }

      logger.info('Retrying transcription', {
        transcriptionId,
        retryCount: transcription.errorDetails?.retryCount || 0
      });

      // Reset status and process again
      transcription.status = 'pending';
      transcription.errorDetails = undefined;
      await transcription.save();

      // Determine if we should use long-running operation
      const duration = transcription.duration || 0;
      const useLongRunning = duration > 60; // Use long-running for audio > 1 minute

      if (useLongRunning) {
        return await this.processLongRunningTranscription(transcription);
      } else {
        return await this.processTranscription(transcription);
      }
    } catch (error) {
      logger.error('Failed to retry transcription', {
        transcriptionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get transcription by voice recording ID
   * @param {string} voiceRecordingId - Voice recording ID
   * @returns {Promise<Object>} Transcription
   */
  async getTranscriptionByVoiceRecording(voiceRecordingId) {
    return await Transcription.findByVoiceRecording(voiceRecordingId);
  }

  /**
   * Get transcriptions by encounter ID
   * @param {string} encounterId - Encounter ID
   * @returns {Promise<Array>} Transcriptions
   */
  async getTranscriptionsByEncounter(encounterId) {
    return await Transcription.findByEncounter(encounterId);
  }

  /**
   * Get pending transcriptions for processing
   * @returns {Promise<Array>} Pending transcriptions
   */
  async getPendingTranscriptions() {
    return await Transcription.findPendingTranscriptions();
  }

  /**
   * Get transcription statistics
   * @param {string} doctorId - Doctor ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Statistics
   */
  async getTranscriptionStats(doctorId, startDate, endDate) {
    return await Transcription.getTranscriptionStats(doctorId, startDate, endDate);
  }
}

module.exports = new TranscriptionService();
