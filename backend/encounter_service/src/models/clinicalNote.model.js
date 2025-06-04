/**
 * Clinical Note Model (MongoDB)
 * Represents clinical notes and documentation for encounters
 */

const mongoose = require('mongoose');

const clinicalNoteSchema = new mongoose.Schema({
  // Reference to encounter
  encounterId: {
    type: String,
    required: true,
    index: true
  },
  
  consultationId: {
    type: String,
    index: true
  },
  
  // Note identification
  noteId: {
    type: String,
    unique: true,
    required: true
  },
  
  noteType: {
    type: String,
    enum: [
      'progress_note',
      'admission_note',
      'discharge_note',
      'consultation_note',
      'procedure_note',
      'operative_note',
      'nursing_note',
      'therapy_note',
      'social_work_note',
      'psychiatric_note',
      'emergency_note'
    ],
    required: true,
    default: 'progress_note'
  },
  
  // Note content structure (SOAP format)
  subjective: {
    chiefComplaint: String,
    historyOfPresentIllness: String,
    reviewOfSystems: {
      constitutional: String,
      cardiovascular: String,
      respiratory: String,
      gastrointestinal: String,
      genitourinary: String,
      musculoskeletal: String,
      neurological: String,
      psychiatric: String,
      endocrine: String,
      hematologic: String,
      allergic: String,
      other: String
    },
    pastMedicalHistory: String,
    pastSurgicalHistory: String,
    medications: [String],
    allergies: [String],
    socialHistory: String,
    familyHistory: String
  },
  
  objective: {
    vitalSigns: {
      bloodPressure: String,
      heartRate: String,
      respiratoryRate: String,
      temperature: String,
      oxygenSaturation: String,
      weight: String,
      height: String,
      bmi: String,
      painScale: String
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
      gastrointestinal: String,
      genitourinary: String,
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
  },
  
  assessment: {
    primaryDiagnosis: String,
    secondaryDiagnoses: [String],
    differentialDiagnoses: [String],
    clinicalImpression: String,
    riskFactors: [String],
    prognosis: String
  },
  
  plan: {
    diagnosticPlan: [String],
    treatmentPlan: [String],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    procedures: [String],
    referrals: [String],
    followUp: String,
    patientEducation: String,
    preventiveCare: String
  },
  
  // Free-text content
  freeTextNote: {
    type: String,
    maxlength: 50000
  },
  
  // Note metadata
  template: {
    templateId: String,
    templateName: String,
    templateVersion: String
  },
  
  // Authoring information
  author: {
    providerId: {
      type: String,
      required: true,
      index: true
    },
    providerName: String,
    providerRole: String,
    specialty: String
  },
  
  // Documentation details
  documentationDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  serviceDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Note status and workflow
  status: {
    type: String,
    enum: [
      'draft',
      'in_progress',
      'pending_review',
      'reviewed',
      'signed',
      'amended',
      'corrected',
      'deleted'
    ],
    default: 'draft',
    index: true
  },
  
  // Digital signature
  signature: {
    isSigned: {
      type: Boolean,
      default: false
    },
    signedBy: String,
    signedDate: Date,
    signatureMethod: {
      type: String,
      enum: ['electronic', 'digital', 'biometric']
    },
    signatureHash: String
  },
  
  // Review and approval
  review: {
    isReviewed: {
      type: Boolean,
      default: false
    },
    reviewedBy: String,
    reviewedDate: Date,
    reviewComments: String,
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'needs_revision']
    }
  },
  
  // Amendments and corrections
  amendments: [{
    amendmentDate: Date,
    amendedBy: String,
    reason: String,
    originalContent: String,
    amendedContent: String,
    amendmentType: {
      type: String,
      enum: ['correction', 'addition', 'deletion', 'clarification']
    }
  }],
  
  // Quality metrics
  quality: {
    completenessScore: {
      type: Number,
      min: 0,
      max: 100
    },
    accuracyScore: {
      type: Number,
      min: 0,
      max: 100
    },
    timelinessScore: {
      type: Number,
      min: 0,
      max: 100
    },
    qualityFlags: [String]
  },
  
  // AI assistance
  aiAssistance: {
    aiGenerated: {
      type: Boolean,
      default: false
    },
    aiModel: String,
    aiVersion: String,
    aiConfidence: Number,
    humanReviewed: {
      type: Boolean,
      default: false
    },
    humanModifications: [String]
  },
  
  // Voice transcription
  voiceTranscription: {
    hasVoiceInput: {
      type: Boolean,
      default: false
    },
    transcriptionId: String,
    transcriptionAccuracy: Number,
    speakerIdentification: [String],
    transcriptionTimestamp: Date
  },
  
  // Billing and coding
  billing: {
    cptCodes: [String],
    icdCodes: [String],
    billingNotes: String,
    levelOfService: String,
    complexityLevel: {
      type: String,
      enum: ['low', 'moderate', 'high']
    }
  },
  
  // Compliance and legal
  compliance: {
    hipaaCompliant: {
      type: Boolean,
      default: true
    },
    retentionPeriod: String,
    legalHold: {
      type: Boolean,
      default: false
    },
    auditTrail: [{
      action: String,
      userId: String,
      timestamp: Date,
      details: String
    }]
  },
  
  // Integration and interoperability
  integration: {
    ehrSystemId: String,
    externalNoteId: String,
    fhirResourceId: String,
    hl7MessageId: String,
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'failed', 'not_applicable']
    }
  },
  
  // Attachments and references
  attachments: [{
    attachmentId: String,
    fileName: String,
    fileType: String,
    fileSize: Number,
    uploadDate: Date,
    description: String
  }],
  
  references: [{
    referenceType: {
      type: String,
      enum: ['lab_result', 'imaging', 'document', 'note', 'order']
    },
    referenceId: String,
    description: String
  }],
  
  // Patient interaction
  patientInteraction: {
    patientPresent: {
      type: Boolean,
      default: true
    },
    communicationBarriers: [String],
    interpreterUsed: {
      type: Boolean,
      default: false
    },
    patientUnderstanding: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'not_assessed']
    }
  },
  
  // Metadata
  metadata: {
    wordCount: Number,
    characterCount: Number,
    estimatedReadTime: Number,
    complexity: {
      type: String,
      enum: ['simple', 'moderate', 'complex']
    },
    tags: [String],
    categories: [String]
  }
}, {
  timestamps: true,
  collection: 'clinical_notes'
});

// Indexes for performance
clinicalNoteSchema.index({ encounterId: 1, documentationDate: -1 });
clinicalNoteSchema.index({ 'author.providerId': 1, documentationDate: -1 });
clinicalNoteSchema.index({ status: 1, documentationDate: -1 });
clinicalNoteSchema.index({ noteType: 1, serviceDate: -1 });
clinicalNoteSchema.index({ 'signature.isSigned': 1, 'signature.signedDate': -1 });

// Pre-save middleware
clinicalNoteSchema.pre('save', function(next) {
  // Generate noteId if not provided
  if (!this.noteId) {
    this.noteId = `NOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Calculate metadata
  if (this.freeTextNote) {
    this.metadata.wordCount = this.freeTextNote.split(/\s+/).length;
    this.metadata.characterCount = this.freeTextNote.length;
    this.metadata.estimatedReadTime = Math.ceil(this.metadata.wordCount / 200); // 200 words per minute
  }
  
  // Set complexity based on content length and structure
  const totalContent = JSON.stringify(this.subjective) + JSON.stringify(this.objective) + 
                      JSON.stringify(this.assessment) + JSON.stringify(this.plan) + 
                      (this.freeTextNote || '');
  
  if (totalContent.length < 1000) {
    this.metadata.complexity = 'simple';
  } else if (totalContent.length < 5000) {
    this.metadata.complexity = 'moderate';
  } else {
    this.metadata.complexity = 'complex';
  }
  
  next();
});

// Instance methods
clinicalNoteSchema.methods.isSigned = function() {
  return this.signature.isSigned;
};

clinicalNoteSchema.methods.isComplete = function() {
  return this.status === 'signed' || this.status === 'reviewed';
};

clinicalNoteSchema.methods.canBeModified = function() {
  return ['draft', 'in_progress', 'pending_review'].includes(this.status);
};

clinicalNoteSchema.methods.addAmendment = function(amendmentData) {
  this.amendments.push({
    amendmentDate: new Date(),
    ...amendmentData
  });
  return this.save();
};

// Static methods
clinicalNoteSchema.statics.findByEncounter = function(encounterId) {
  return this.find({ encounterId }).sort({ documentationDate: -1 });
};

clinicalNoteSchema.statics.findByProvider = function(providerId, limit = 20) {
  return this.find({ 'author.providerId': providerId })
    .sort({ documentationDate: -1 })
    .limit(limit);
};

clinicalNoteSchema.statics.findUnsigned = function() {
  return this.find({ 'signature.isSigned': false })
    .sort({ documentationDate: 1 });
};

module.exports = mongoose.model('ClinicalNote', clinicalNoteSchema);
