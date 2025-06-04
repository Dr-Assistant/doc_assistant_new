const mongoose = require('mongoose');
const { Schema } = mongoose;

// Medical History Schema
const MedicalHistorySchema = new Schema({
  condition: {
    type: String,
    required: true
  },
  diagnosedDate: Date,
  status: {
    type: String,
    enum: ['active', 'resolved', 'chronic', 'managed'],
    default: 'active'
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    default: 'moderate'
  },
  notes: String,
  source: {
    type: String,
    enum: ['abdm', 'local', 'questionnaire', 'manual'],
    default: 'local'
  }
}, { _id: false });

// Medication Schema
const MedicationSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  dosage: String,
  frequency: String,
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'discontinued', 'completed'],
    default: 'active'
  },
  prescribedBy: String,
  indication: String,
  source: {
    type: String,
    enum: ['abdm', 'local', 'questionnaire', 'manual'],
    default: 'local'
  }
}, { _id: false });

// Allergy Schema
const AllergySchema = new Schema({
  allergen: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['drug', 'food', 'environmental', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'life-threatening'],
    required: true
  },
  reaction: String,
  notes: String,
  source: {
    type: String,
    enum: ['abdm', 'local', 'questionnaire', 'manual'],
    default: 'local'
  }
}, { _id: false });

// Vital Signs Schema
const VitalSignsSchema = new Schema({
  bloodPressure: {
    systolic: Number,
    diastolic: Number,
    unit: { type: String, default: 'mmHg' }
  },
  heartRate: {
    value: Number,
    unit: { type: String, default: 'bpm' }
  },
  temperature: {
    value: Number,
    unit: { type: String, default: 'C' }
  },
  respiratoryRate: {
    value: Number,
    unit: { type: String, default: 'breaths/min' }
  },
  oxygenSaturation: {
    value: Number,
    unit: { type: String, default: '%' }
  },
  weight: {
    value: Number,
    unit: { type: String, default: 'kg' }
  },
  height: {
    value: Number,
    unit: { type: String, default: 'cm' }
  },
  bmi: Number,
  recordedDate: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['abdm', 'local', 'questionnaire', 'manual'],
    default: 'local'
  }
}, { _id: false });

// Questionnaire Response Schema
const QuestionnaireResponseSchema = new Schema({
  questionId: String,
  question: String,
  answer: Schema.Types.Mixed,
  category: {
    type: String,
    enum: ['symptoms', 'history', 'lifestyle', 'family_history', 'social_history'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, { _id: false });

// AI Summary Schema
const AISummarySchema = new Schema({
  keyFindings: [String],
  riskFactors: [String],
  recommendations: [String],
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  model: {
    type: String,
    default: 'gemini-1.5-pro'
  },
  version: {
    type: String,
    default: '1.0'
  },
  processingTime: Number, // in milliseconds
  tokenUsage: {
    inputTokens: Number,
    outputTokens: Number,
    totalTokens: Number
  }
}, { _id: false });

// Main Pre-Diagnosis Summary Schema
const PreDiagnosisSummarySchema = new Schema({
  // Patient and encounter information
  patientId: {
    type: String,
    required: true,
    index: true
  },
  encounterId: {
    type: String,
    index: true
  },
  doctorId: {
    type: String,
    required: true,
    index: true
  },
  appointmentId: {
    type: String,
    index: true
  },

  // Summary metadata
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed', 'expired'],
    default: 'generating',
    index: true
  },
  version: {
    type: Number,
    default: 1
  },
  
  // Patient data sources
  dataSources: {
    abdmRecords: {
      available: { type: Boolean, default: false },
      lastFetched: Date,
      recordCount: { type: Number, default: 0 },
      errors: [String]
    },
    localRecords: {
      available: { type: Boolean, default: false },
      lastUpdated: Date,
      recordCount: { type: Number, default: 0 }
    },
    questionnaire: {
      completed: { type: Boolean, default: false },
      completedAt: Date,
      responseCount: { type: Number, default: 0 }
    }
  },

  // Medical information
  medicalHistory: [MedicalHistorySchema],
  currentMedications: [MedicationSchema],
  allergies: [AllergySchema],
  vitalSigns: VitalSignsSchema,
  
  // Questionnaire responses
  questionnaireResponses: [QuestionnaireResponseSchema],
  
  // AI-generated summary
  aiSummary: AISummarySchema,
  
  // Additional metadata
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [String],
  notes: String,
  
  // Audit fields
  createdBy: String,
  updatedBy: String,
  viewedBy: [String],
  lastViewedAt: Date
}, {
  timestamps: true,
  collection: 'pre_diagnosis_summaries'
});

// Indexes for performance
PreDiagnosisSummarySchema.index({ patientId: 1, createdAt: -1 });
PreDiagnosisSummarySchema.index({ doctorId: 1, createdAt: -1 });
PreDiagnosisSummarySchema.index({ status: 1, createdAt: -1 });
PreDiagnosisSummarySchema.index({ 'aiSummary.urgencyLevel': 1 });

// Instance methods
PreDiagnosisSummarySchema.methods.markAsViewed = function(userId) {
  if (!this.viewedBy.includes(userId)) {
    this.viewedBy.push(userId);
  }
  this.lastViewedAt = new Date();
  return this.save();
};

PreDiagnosisSummarySchema.methods.updateStatus = function(status, updatedBy) {
  this.status = status;
  this.updatedBy = updatedBy;
  return this.save();
};

// Static methods
PreDiagnosisSummarySchema.statics.findByPatient = function(patientId, limit = 10) {
  return this.find({ patientId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

PreDiagnosisSummarySchema.statics.findByDoctor = function(doctorId, limit = 20) {
  return this.find({ doctorId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('PreDiagnosisSummary', PreDiagnosisSummarySchema);
