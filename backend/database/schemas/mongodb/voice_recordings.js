/**
 * Voice Recordings Schema
 * For storing and managing voice recordings
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Processing stats schema
const ProcessingStatsSchema = new Schema({
  transcriptionTime: Number,
  wordCount: Number,
  confidence: Number
});

// Metadata schema
const MetadataSchema = new Schema({
  deviceInfo: String,
  quality: String,
  processingStats: ProcessingStatsSchema
});

// Retention policy schema
const RetentionPolicySchema = new Schema({
  expiresAt: Date,
  retentionReason: String
});

// Main voice recording schema
const VoiceRecordingSchema = new Schema({
  encounterId: {
    type: String,
    required: true,
    index: true
  },
  patientId: {
    type: String,
    required: true,
    index: true
  },
  doctorId: {
    type: String,
    required: true,
    index: true
  },
  duration: {
    type: Number,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'transcribed', 'error'],
    default: 'processing',
    index: true
  },
  transcriptionId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  metadata: MetadataSchema,
  retentionPolicy: RetentionPolicySchema,
  fileId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes
VoiceRecordingSchema.index({ encounterId: 1, createdAt: -1 });
VoiceRecordingSchema.index({ patientId: 1, createdAt: -1 });
VoiceRecordingSchema.index({ doctorId: 1, createdAt: -1 });
VoiceRecordingSchema.index({ 'retentionPolicy.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Update the updatedAt field on save
VoiceRecordingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = VoiceRecordingSchema;
