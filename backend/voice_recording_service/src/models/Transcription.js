const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Word-level transcription schema
const WordSchema = new Schema({
  word: {
    type: String,
    required: true
  },
  startTime: {
    type: Number, // in seconds
    required: true
  },
  endTime: {
    type: Number, // in seconds
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  speakerTag: {
    type: Number,
    default: 0 // 0 for unknown, 1+ for identified speakers
  }
}, { _id: false });

// Alternative transcription schema (for multiple recognition results)
const AlternativeSchema = new Schema({
  transcript: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  words: [WordSchema]
}, { _id: false });

// Processing metadata schema
const ProcessingMetadataSchema = new Schema({
  audioFormat: {
    type: String,
    required: true
  },
  sampleRate: {
    type: Number,
    required: true
  },
  channels: {
    type: Number,
    default: 1
  },
  languageCode: {
    type: String,
    default: 'en-US'
  },
  enableSpeakerDiarization: {
    type: Boolean,
    default: false
  },
  speakerCount: {
    type: Number,
    min: 1,
    max: 10
  },
  enableAutomaticPunctuation: {
    type: Boolean,
    default: true
  },
  enableWordTimeOffsets: {
    type: Boolean,
    default: true
  },
  model: {
    type: String,
    enum: ['latest_long', 'latest_short', 'command_and_search', 'phone_call', 'video', 'default'],
    default: 'latest_long'
  },
  useEnhanced: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Error details schema
const ErrorDetailsSchema = new Schema({
  code: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: Schema.Types.Mixed
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: {
    type: Date
  }
}, { _id: false });

// Main transcription schema
const TranscriptionSchema = new Schema({
  voiceRecordingId: {
    type: Schema.Types.ObjectId,
    ref: 'VoiceRecording',
    required: true,
    index: true
  },
  encounterId: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      },
      message: 'Invalid encounter ID format'
    }
  },
  patientId: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      },
      message: 'Invalid patient ID format'
    }
  },
  doctorId: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      },
      message: 'Invalid doctor ID format'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  transcript: {
    type: String,
    index: 'text' // Text index for search
  },
  alternatives: [AlternativeSchema],
  words: [WordSchema],
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  duration: {
    type: Number, // in seconds
    min: 0
  },
  wordCount: {
    type: Number,
    min: 0
  },
  speakerCount: {
    type: Number,
    min: 1,
    default: 1
  },
  processingMetadata: {
    type: ProcessingMetadataSchema,
    required: true
  },
  googleJobId: {
    type: String,
    index: true
  },
  processingStartedAt: {
    type: Date
  },
  processingCompletedAt: {
    type: Date
  },
  processingDuration: {
    type: Number // in milliseconds
  },
  errorDetails: ErrorDetailsSchema,
  medicalTermsDetected: [{
    term: String,
    confidence: Number,
    startTime: Number,
    endTime: Number
  }],
  qualityMetrics: {
    overallConfidence: {
      type: Number,
      min: 0,
      max: 1
    },
    lowConfidenceWordCount: {
      type: Number,
      min: 0
    },
    silenceDuration: {
      type: Number,
      min: 0
    },
    backgroundNoiseLevel: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
TranscriptionSchema.index({ voiceRecordingId: 1, status: 1 });
TranscriptionSchema.index({ encounterId: 1, createdAt: -1 });
TranscriptionSchema.index({ doctorId: 1, createdAt: -1 });
TranscriptionSchema.index({ status: 1, createdAt: 1 });
TranscriptionSchema.index({ googleJobId: 1 }, { sparse: true });

// Virtual for processing time
TranscriptionSchema.virtual('processingTimeMs').get(function() {
  if (this.processingStartedAt && this.processingCompletedAt) {
    return this.processingCompletedAt.getTime() - this.processingStartedAt.getTime();
  }
  return null;
});

// Virtual for average word confidence
TranscriptionSchema.virtual('averageWordConfidence').get(function() {
  if (this.words && this.words.length > 0) {
    const totalConfidence = this.words.reduce((sum, word) => sum + word.confidence, 0);
    return totalConfidence / this.words.length;
  }
  return null;
});

// Instance methods
TranscriptionSchema.methods.markAsProcessing = function() {
  this.status = 'processing';
  this.processingStartedAt = new Date();
  return this.save();
};

TranscriptionSchema.methods.markAsCompleted = function(transcriptionData) {
  this.status = 'completed';
  this.processingCompletedAt = new Date();
  this.transcript = transcriptionData.transcript;
  this.alternatives = transcriptionData.alternatives || [];
  this.words = transcriptionData.words || [];
  this.confidence = transcriptionData.confidence;
  this.duration = transcriptionData.duration;
  this.wordCount = transcriptionData.wordCount;
  this.speakerCount = transcriptionData.speakerCount || 1;
  this.qualityMetrics = transcriptionData.qualityMetrics || {};
  this.medicalTermsDetected = transcriptionData.medicalTermsDetected || [];

  if (this.processingStartedAt) {
    this.processingDuration = this.processingCompletedAt.getTime() - this.processingStartedAt.getTime();
  }

  return this.save();
};

TranscriptionSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.processingCompletedAt = new Date();
  this.errorDetails = {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'Unknown error occurred',
    details: error.details || {},
    retryCount: (this.errorDetails?.retryCount || 0) + 1,
    lastRetryAt: new Date()
  };

  if (this.processingStartedAt) {
    this.processingDuration = this.processingCompletedAt.getTime() - this.processingStartedAt.getTime();
  }

  return this.save();
};

// Static methods
TranscriptionSchema.statics.findByVoiceRecording = function(voiceRecordingId) {
  return this.findOne({ voiceRecordingId });
};

TranscriptionSchema.statics.findByEncounter = function(encounterId) {
  return this.find({ encounterId }).sort({ createdAt: -1 });
};

TranscriptionSchema.statics.findPendingTranscriptions = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: 1 });
};

TranscriptionSchema.statics.getTranscriptionStats = async function(doctorId, startDate, endDate) {
  try {
    const query = { doctorId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    // Get all transcriptions for the doctor
    const transcriptions = await this.find(query);

    // Calculate stats manually to avoid aggregation authentication issues
    const stats = {
      total: transcriptions.length,
      byStatus: {},
      avgConfidence: 0,
      avgDuration: 0,
      avgProcessingTime: 0
    };

    if (transcriptions.length === 0) {
      return stats;
    }

    // Group by status and calculate averages
    const statusGroups = {};
    let totalConfidence = 0;
    let totalDuration = 0;
    let totalProcessingTime = 0;
    let confidenceCount = 0;
    let durationCount = 0;
    let processingTimeCount = 0;

    transcriptions.forEach(t => {
      // Count by status
      if (!statusGroups[t.status]) {
        statusGroups[t.status] = 0;
      }
      statusGroups[t.status]++;

      // Sum for averages
      if (t.confidence != null) {
        totalConfidence += t.confidence;
        confidenceCount++;
      }
      if (t.duration != null) {
        totalDuration += t.duration;
        durationCount++;
      }
      if (t.processingDuration != null) {
        totalProcessingTime += t.processingDuration;
        processingTimeCount++;
      }
    });

    stats.byStatus = statusGroups;
    stats.avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    stats.avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;
    stats.avgProcessingTime = processingTimeCount > 0 ? totalProcessingTime / processingTimeCount : 0;

    return stats;
  } catch (error) {
    // Return basic stats if there's an error
    return {
      total: 0,
      byStatus: {},
      avgConfidence: 0,
      avgDuration: 0,
      avgProcessingTime: 0,
      error: 'Unable to retrieve detailed statistics'
    };
  }
};

// Pre-save middleware
TranscriptionSchema.pre('save', function(next) {
  // Calculate word count if transcript is available
  if (this.transcript && !this.wordCount) {
    this.wordCount = this.transcript.split(/\s+/).filter(word => word.length > 0).length;
  }

  // Calculate overall confidence from quality metrics
  if (this.words && this.words.length > 0 && !this.qualityMetrics?.overallConfidence) {
    const avgConfidence = this.words.reduce((sum, word) => sum + word.confidence, 0) / this.words.length;
    if (!this.qualityMetrics) this.qualityMetrics = {};
    this.qualityMetrics.overallConfidence = avgConfidence;
  }

  next();
});

module.exports = mongoose.model('Transcription', TranscriptionSchema);
