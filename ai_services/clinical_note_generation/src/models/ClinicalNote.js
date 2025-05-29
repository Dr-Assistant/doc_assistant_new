const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Subjective section schema (Patient's perspective)
const SubjectiveSchema = new Schema({
  chiefComplaint: {
    type: String,
    required: true,
    maxlength: 500
  },
  historyOfPresentIllness: {
    type: String,
    required: true,
    maxlength: 2000
  },
  reviewOfSystems: {
    constitutional: String,
    cardiovascular: String,
    respiratory: String,
    gastrointestinal: String,
    musculoskeletal: String,
    neurological: String,
    psychiatric: String,
    endocrine: String,
    hematologic: String,
    allergic: String,
    skin: String,
    genitourinary: String
  },
  pastMedicalHistory: {
    type: String,
    maxlength: 1000
  },
  medications: {
    type: String,
    maxlength: 1000
  },
  allergies: {
    type: String,
    maxlength: 500
  },
  familyHistory: {
    type: String,
    maxlength: 500
  },
  socialHistory: {
    type: String,
    maxlength: 500
  }
}, { _id: false });

// Objective section schema (Doctor's observations)
const ObjectiveSchema = new Schema({
  vitalSigns: {
    bloodPressure: String,
    heartRate: String,
    temperature: String,
    respiratoryRate: String,
    oxygenSaturation: String,
    weight: String,
    height: String,
    bmi: String
  },
  physicalExamination: {
    general: String,
    head: String,
    eyes: String,
    ears: String,
    nose: String,
    throat: String,
    neck: String,
    cardiovascular: String,
    respiratory: String,
    abdominal: String,
    musculoskeletal: String,
    neurological: String,
    psychiatric: String,
    skin: String,
    extremities: String
  },
  diagnosticResults: {
    laboratoryResults: [String],
    imagingResults: [String],
    otherTests: [String]
  }
}, { _id: false });

// Assessment section schema (Doctor's analysis)
const AssessmentSchema = new Schema({
  primaryDiagnosis: {
    code: String,
    description: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  secondaryDiagnoses: [{
    code: String,
    description: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  differentialDiagnoses: [String],
  clinicalImpression: {
    type: String,
    required: true,
    maxlength: 1000
  },
  riskFactors: [String],
  prognosis: String
}, { _id: false });

// Plan section schema (Treatment plan)
const PlanSchema = new Schema({
  diagnostics: [{
    test: String,
    reason: String,
    priority: {
      type: String,
      enum: ['urgent', 'routine', 'follow-up']
    }
  }],
  treatments: [{
    intervention: String,
    instructions: String,
    duration: String
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    indication: String
  }],
  patientEducation: [String],
  followUp: {
    timeframe: String,
    instructions: String,
    provider: String
  },
  referrals: [{
    specialty: String,
    reason: String,
    urgency: {
      type: String,
      enum: ['urgent', 'routine', 'non-urgent']
    }
  }],
  lifestyle: [String],
  monitoring: [String]
}, { _id: false });

// AI Generation metadata
const AIMetadataSchema = new Schema({
  model: {
    type: String,
    required: true
  },
  version: String,
  temperature: Number,
  maxTokens: Number,
  promptVersion: String,
  processingTime: Number, // in milliseconds
  tokenUsage: {
    inputTokens: Number,
    outputTokens: Number,
    totalTokens: Number
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  qualityMetrics: {
    completeness: Number,
    accuracy: Number,
    relevance: Number,
    clarity: Number
  },
  extractedEntities: [{
    type: String,
    value: String,
    confidence: Number,
    startIndex: Number,
    endIndex: Number
  }]
}, { _id: false });

// Edit history schema
const EditHistorySchema = new Schema({
  editedBy: {
    type: String,
    required: true
  },
  editedAt: {
    type: Date,
    default: Date.now
  },
  section: String,
  changes: [{
    field: String,
    oldValue: String,
    newValue: String
  }],
  reason: String
}, { _id: false });

// Main clinical note schema
const ClinicalNoteSchema = new Schema({
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
  transcriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Transcription',
    index: true
  },
  status: {
    type: String,
    enum: ['generating', 'draft', 'review', 'approved', 'signed', 'amended', 'cancelled'],
    default: 'generating',
    index: true
  },
  noteType: {
    type: String,
    enum: ['soap', 'progress', 'procedure', 'discharge', 'referral', 'consultation', 'follow-up'],
    default: 'soap',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // SOAP Note Content
  subjective: {
    type: SubjectiveSchema,
    required: true
  },
  objective: ObjectiveSchema,
  assessment: {
    type: AssessmentSchema,
    required: true
  },
  plan: {
    type: PlanSchema,
    required: true
  },

  // Source and processing data
  rawTranscription: {
    type: String,
    required: true
  },
  processedTranscription: String,
  aiMetadata: {
    type: AIMetadataSchema,
    required: true
  },

  // Review and approval
  reviewedBy: String,
  reviewedAt: Date,
  reviewComments: String,
  approvedBy: String,
  approvedAt: Date,
  signedBy: String,
  signedAt: Date,

  // Edit tracking
  editHistory: [EditHistorySchema],
  lastEditedBy: String,
  lastEditedAt: Date,

  // Additional metadata
  tags: [String],
  attachments: [Schema.Types.ObjectId],
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateId: Schema.Types.ObjectId,

  // Compliance and audit
  complianceFlags: [{
    type: String,
    description: String,
    severity: {
      type: String,
      enum: ['info', 'warning', 'error']
    }
  }],
  auditTrail: [{
    action: String,
    performedBy: String,
    performedAt: {
      type: Date,
      default: Date.now
    },
    details: Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ClinicalNoteSchema.index({ encounterId: 1, status: 1 });
ClinicalNoteSchema.index({ patientId: 1, createdAt: -1 });
ClinicalNoteSchema.index({ doctorId: 1, createdAt: -1 });
ClinicalNoteSchema.index({ status: 1, priority: 1 });
ClinicalNoteSchema.index({ noteType: 1, createdAt: -1 });
ClinicalNoteSchema.index({ transcriptionId: 1 }, { sparse: true });

// Text search index
ClinicalNoteSchema.index({
  'subjective.chiefComplaint': 'text',
  'subjective.historyOfPresentIllness': 'text',
  'assessment.clinicalImpression': 'text',
  'plan.followUp.instructions': 'text',
  rawTranscription: 'text'
});

// Virtual for word count
ClinicalNoteSchema.virtual('wordCount').get(function() {
  const sections = [
    this.subjective?.chiefComplaint,
    this.subjective?.historyOfPresentIllness,
    this.assessment?.clinicalImpression,
    this.plan?.followUp?.instructions
  ].filter(Boolean);

  return sections.join(' ').split(/\s+/).filter(word => word.length > 0).length;
});

// Virtual for completion percentage
ClinicalNoteSchema.virtual('completionPercentage').get(function() {
  const requiredFields = [
    this.subjective?.chiefComplaint,
    this.subjective?.historyOfPresentIllness,
    this.assessment?.clinicalImpression,
    this.assessment?.primaryDiagnosis?.description
  ];

  const completedFields = requiredFields.filter(Boolean).length;
  return Math.round((completedFields / requiredFields.length) * 100);
});

// Instance methods
ClinicalNoteSchema.methods.markAsReviewed = function(reviewerId, comments) {
  this.status = 'review';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewComments = comments;
  this.addAuditEntry('reviewed', reviewerId, { comments });
  return this.save();
};

ClinicalNoteSchema.methods.markAsApproved = function(approverId) {
  this.status = 'approved';
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  this.addAuditEntry('approved', approverId);
  return this.save();
};

ClinicalNoteSchema.methods.markAsSigned = function(signerId) {
  this.status = 'signed';
  this.signedBy = signerId;
  this.signedAt = new Date();
  this.addAuditEntry('signed', signerId);
  return this.save();
};

ClinicalNoteSchema.methods.addEdit = function(editorId, section, changes, reason) {
  this.editHistory.push({
    editedBy: editorId,
    editedAt: new Date(),
    section,
    changes,
    reason
  });
  this.lastEditedBy = editorId;
  this.lastEditedAt = new Date();
  this.addAuditEntry('edited', editorId, { section, changes, reason });
  return this.save();
};

ClinicalNoteSchema.methods.addAuditEntry = function(action, performedBy, details = {}) {
  this.auditTrail.push({
    action,
    performedBy,
    performedAt: new Date(),
    details
  });
};

ClinicalNoteSchema.methods.addComplianceFlag = function(type, description, severity = 'warning') {
  this.complianceFlags.push({
    type,
    description,
    severity
  });
  return this.save();
};

ClinicalNoteSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  // Remove sensitive fields if needed
  return obj;
};

// Static methods
ClinicalNoteSchema.statics.findByEncounter = function(encounterId) {
  return this.findOne({ encounterId }).sort({ createdAt: -1 });
};

ClinicalNoteSchema.statics.findByPatient = function(patientId, limit = 10) {
  return this.find({ patientId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-rawTranscription -processedTranscription');
};

ClinicalNoteSchema.statics.findByDoctor = function(doctorId, startDate, endDate) {
  const query = { doctorId };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return this.find(query).sort({ createdAt: -1 });
};

ClinicalNoteSchema.statics.findPendingReview = function(doctorId) {
  const query = { status: { $in: ['draft', 'review'] } };
  if (doctorId) query.doctorId = doctorId;

  return this.find(query).sort({ priority: -1, createdAt: 1 });
};

ClinicalNoteSchema.statics.getStatistics = function(doctorId, startDate, endDate) {
  const matchStage = {};
  if (doctorId) matchStage.doctorId = doctorId;

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$aiMetadata.confidenceScore' },
        avgProcessingTime: { $avg: '$aiMetadata.processingTime' }
      }
    }
  ]);
};

// Pre-save middleware
ClinicalNoteSchema.pre('save', function(next) {
  // Update lastEditedAt if content changed
  if (this.isModified() && !this.isNew) {
    this.lastEditedAt = new Date();
  }

  // Add audit entry for creation
  if (this.isNew) {
    this.addAuditEntry('created', this.doctorId);
  }

  next();
});

module.exports = mongoose.model('ClinicalNote', ClinicalNoteSchema);
