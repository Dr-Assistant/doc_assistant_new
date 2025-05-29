const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Processing stats schema
const ProcessingStatsSchema = new Schema({
  transcriptionTime: {
    type: Number,
    min: 0
  },
  wordCount: {
    type: Number,
    min: 0
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  }
}, { _id: false });

// Metadata schema
const MetadataSchema = new Schema({
  deviceInfo: {
    type: String,
    maxlength: 255
  },
  quality: {
    type: String,
    enum: ['low', 'medium', 'high', 'excellent'],
    default: 'medium'
  },
  processingStats: ProcessingStatsSchema,
  originalFileName: {
    type: String,
    maxlength: 255
  },
  uploadedBy: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    maxlength: 45
  },
  userAgent: {
    type: String,
    maxlength: 500
  }
}, { _id: false });

// Retention policy schema
const RetentionPolicySchema = new Schema({
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  retentionReason: {
    type: String,
    enum: ['clinical', 'legal', 'research', 'audit'],
    default: 'clinical'
  },
  retentionDays: {
    type: Number,
    min: 1,
    max: 365,
    default: 90
  }
}, { _id: false });

// Encryption schema
const EncryptionSchema = new Schema({
  algorithm: {
    type: String,
    required: true,
    default: 'aes-256-gcm'
  },
  keyId: {
    type: String,
    required: true
  },
  iv: {
    type: String,
    required: true
  },
  authTag: {
    type: String,
    required: true
  }
}, { _id: false });

// Main voice recording schema
const VoiceRecordingSchema = new Schema({
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
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 3600 // 1 hour max
  },
  fileSize: {
    type: Number,
    required: true,
    min: 1
  },
  mimeType: {
    type: String,
    required: true,
    enum: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/ogg']
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'transcribed', 'error', 'deleted'],
    default: 'uploading',
    index: true
  },
  transcriptionId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  metadata: {
    type: MetadataSchema,
    required: true
  },
  retentionPolicy: {
    type: RetentionPolicySchema,
    required: true
  },
  fileId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  encryption: {
    type: EncryptionSchema,
    required: true
  },
  checksum: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[a-f0-9]{64}$/i.test(v);
      },
      message: 'Invalid checksum format'
    }
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

// Compound indexes for efficient queries
VoiceRecordingSchema.index({ encounterId: 1, createdAt: -1 });
VoiceRecordingSchema.index({ patientId: 1, createdAt: -1 });
VoiceRecordingSchema.index({ doctorId: 1, createdAt: -1 });
VoiceRecordingSchema.index({ status: 1, createdAt: -1 });

// Update the updatedAt field on save
VoiceRecordingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
VoiceRecordingSchema.methods.isExpired = function() {
  return this.retentionPolicy.expiresAt < new Date();
};

VoiceRecordingSchema.methods.canBeDeleted = function() {
  return this.status !== 'uploading' && this.status !== 'processing';
};

VoiceRecordingSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.encryption;
  delete obj.checksum;
  return obj;
};

// Static methods
VoiceRecordingSchema.statics.findByEncounter = function(encounterId) {
  return this.find({ encounterId }).sort({ createdAt: -1 });
};

VoiceRecordingSchema.statics.findExpired = function() {
  return this.find({
    'retentionPolicy.expiresAt': { $lt: new Date() },
    status: { $ne: 'deleted' }
  });
};

module.exports = mongoose.model('VoiceRecording', VoiceRecordingSchema);
