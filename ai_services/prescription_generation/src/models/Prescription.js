const mongoose = require('mongoose');

// Medication Item Schema
const medicationItemSchema = new mongoose.Schema({
  medicationName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  genericName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  brandName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  dosage: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['mg', 'mcg', 'g', 'ml', 'units', 'puffs', 'drops', 'tablets', 'capsules']
    }
  },
  frequency: {
    times: {
      type: Number,
      required: true,
      min: 1,
      max: 24
    },
    period: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'monthly', 'as needed']
    },
    interval: {
      type: Number, // hours between doses
      min: 1,
      max: 168 // 1 week
    },
    abbreviation: {
      type: String,
      enum: ['qd', 'bid', 'tid', 'qid', 'q4h', 'q6h', 'q8h', 'q12h', 'prn', 'qhs', 'ac', 'pc']
    }
  },
  duration: {
    amount: {
      type: Number,
      min: 1
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'ongoing']
    }
  },
  quantity: {
    amount: {
      type: Number,
      min: 1
    },
    unit: {
      type: String,
      enum: ['tablets', 'capsules', 'ml', 'bottles', 'inhalers', 'vials']
    }
  },
  refills: {
    type: Number,
    default: 0,
    min: 0,
    max: 12
  },
  route: {
    type: String,
    required: true,
    enum: ['oral', 'topical', 'injection', 'inhalation', 'sublingual', 'rectal', 'ophthalmic', 'otic', 'nasal']
  },
  instructions: {
    type: String,
    maxlength: 500,
    trim: true
  },
  indication: {
    type: String,
    maxlength: 200,
    trim: true
  },
  category: {
    type: String,
    enum: ['cardiovascular', 'endocrine', 'antibiotic', 'analgesic', 'respiratory', 'psychiatric', 'gastrointestinal', 'dermatologic', 'other']
  },
  drugClass: {
    type: String,
    maxlength: 100
  },
  isControlledSubstance: {
    type: Boolean,
    default: false
  },
  controlledSubstanceSchedule: {
    type: String,
    enum: ['I', 'II', 'III', 'IV', 'V']
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  }
}, {
  timestamps: true
});

// Drug Interaction Schema
const drugInteractionSchema = new mongoose.Schema({
  medication1: {
    type: String,
    required: true
  },
  medication2: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['minor', 'moderate', 'major', 'contraindicated']
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  recommendation: {
    type: String,
    maxlength: 500
  }
});

// Prescription Schema
const prescriptionSchema = new mongoose.Schema({
  // Core Identifiers
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
  clinicalNoteId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  transcriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },

  // Prescription Details
  medications: [medicationItemSchema],
  
  // Status and Workflow
  status: {
    type: String,
    required: true,
    enum: ['generating', 'draft', 'review', 'approved', 'signed', 'sent', 'dispensed', 'cancelled'],
    default: 'generating',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // Validity and Dates
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date
  },
  signedAt: {
    type: Date
  },
  sentAt: {
    type: Date
  },

  // AI Processing Metadata
  aiMetadata: {
    model: {
      type: String,
      default: 'gemini-1.5-pro'
    },
    version: {
      type: String,
      default: '1.0'
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    processingTime: {
      type: Number // milliseconds
    },
    extractedMedications: {
      type: Number,
      default: 0
    },
    qualityMetrics: {
      completeness: { type: Number, min: 0, max: 1 },
      accuracy: { type: Number, min: 0, max: 1 },
      clarity: { type: Number, min: 0, max: 1 },
      safety: { type: Number, min: 0, max: 1 }
    }
  },

  // Drug Interactions and Safety
  drugInteractions: [drugInteractionSchema],
  allergyAlerts: [{
    allergen: String,
    medication: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'life-threatening']
    },
    description: String
  }],
  dosageAlerts: [{
    medication: String,
    alertType: {
      type: String,
      enum: ['overdose', 'underdose', 'frequency', 'duration', 'age-inappropriate']
    },
    description: String,
    recommendation: String
  }],

  // Compliance and Quality
  complianceFlags: [{
    type: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error'],
      default: 'info'
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Edit History and Audit Trail
  editHistory: [{
    editedBy: {
      type: String,
      required: true
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'reviewed', 'approved', 'signed', 'sent', 'cancelled', 'regenerated'],
      required: true
    },
    changes: [{
      field: String,
      oldValue: String,
      newValue: String
    }],
    reason: String
  }],

  // Additional Information
  notes: {
    type: String,
    maxlength: 1000
  },
  pharmacyId: {
    type: String
  },
  rawTranscription: {
    type: String
  },
  extractedText: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for performance
prescriptionSchema.index({ encounterId: 1, status: 1 });
prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });
prescriptionSchema.index({ status: 1, createdAt: -1 });
prescriptionSchema.index({ 'medications.medicationName': 1 });

// Virtual properties
prescriptionSchema.virtual('medicationCount').get(function() {
  return this.medications ? this.medications.length : 0;
});

prescriptionSchema.virtual('hasInteractions').get(function() {
  return this.drugInteractions && this.drugInteractions.length > 0;
});

prescriptionSchema.virtual('hasAlerts').get(function() {
  return (this.allergyAlerts && this.allergyAlerts.length > 0) || 
         (this.dosageAlerts && this.dosageAlerts.length > 0);
});

prescriptionSchema.virtual('isSigned').get(function() {
  return this.status === 'signed' && this.signedAt;
});

// Instance methods
prescriptionSchema.methods.addMedication = function(medicationData) {
  this.medications.push(medicationData);
  return this.save();
};

prescriptionSchema.methods.removeMedication = function(medicationId) {
  this.medications.id(medicationId).remove();
  return this.save();
};

prescriptionSchema.methods.addDrugInteraction = function(interaction) {
  this.drugInteractions.push(interaction);
  return this.save();
};

prescriptionSchema.methods.addComplianceFlag = function(type, description, severity = 'info') {
  this.complianceFlags.push({
    type,
    description,
    severity,
    flaggedAt: new Date()
  });
  return this.save();
};

prescriptionSchema.methods.addEdit = function(userId, action, changes, reason) {
  this.editHistory.push({
    editedBy: userId,
    editedAt: new Date(),
    action,
    changes,
    reason
  });
  return this.save();
};

prescriptionSchema.methods.markAsReviewed = function(reviewerId, comments) {
  this.status = 'review';
  return this.addEdit(reviewerId, 'reviewed', [], comments);
};

prescriptionSchema.methods.markAsApproved = function(approverId) {
  this.status = 'approved';
  return this.addEdit(approverId, 'approved', [], 'Prescription approved');
};

prescriptionSchema.methods.markAsSigned = function(signerId) {
  this.status = 'signed';
  this.signedAt = new Date();
  return this.addEdit(signerId, 'signed', [], 'Prescription digitally signed');
};

prescriptionSchema.methods.markAsSent = function(pharmacyId) {
  this.status = 'sent';
  this.sentAt = new Date();
  if (pharmacyId) {
    this.pharmacyId = pharmacyId;
  }
  return this.addEdit(this.doctorId, 'sent', [], 'Prescription sent to pharmacy');
};

// Static methods
prescriptionSchema.statics.findByEncounter = function(encounterId) {
  return this.findOne({ encounterId }).sort({ createdAt: -1 });
};

prescriptionSchema.statics.findByPatient = function(patientId, limit = 10) {
  return this.find({ patientId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

prescriptionSchema.statics.findByDoctor = function(doctorId, startDate, endDate) {
  const query = { doctorId };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  return this.find(query).sort({ createdAt: -1 });
};

prescriptionSchema.statics.findPendingReview = function(doctorId) {
  const query = { status: { $in: ['draft', 'review'] } };
  if (doctorId) {
    query.doctorId = doctorId;
  }
  return this.find(query).sort({ createdAt: -1 });
};

prescriptionSchema.statics.getStatistics = function(doctorId, startDate, endDate) {
  const matchStage = { doctorId };
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPrescriptions: { $sum: 1 },
        signedPrescriptions: {
          $sum: { $cond: [{ $eq: ['$status', 'signed'] }, 1, 0] }
        },
        pendingPrescriptions: {
          $sum: { $cond: [{ $in: ['$status', ['draft', 'review']] }, 1, 0] }
        },
        averageConfidence: { $avg: '$aiMetadata.confidenceScore' },
        averageMedicationsPerPrescription: { $avg: { $size: '$medications' } },
        totalMedications: { $sum: { $size: '$medications' } },
        prescriptionsWithInteractions: {
          $sum: { $cond: [{ $gt: [{ $size: '$drugInteractions' }, 0] }, 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Prescription', prescriptionSchema);
