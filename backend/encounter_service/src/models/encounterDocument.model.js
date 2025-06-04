/**
 * Encounter Document Model (MongoDB)
 * Represents documents, files, and attachments associated with encounters
 */

const mongoose = require('mongoose');

const encounterDocumentSchema = new mongoose.Schema({
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
  
  // Document identification
  documentId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Document metadata
  fileName: {
    type: String,
    required: true
  },
  
  originalFileName: {
    type: String,
    required: true
  },
  
  fileExtension: {
    type: String,
    required: true
  },
  
  mimeType: {
    type: String,
    required: true
  },
  
  fileSize: {
    type: Number,
    required: true
  },
  
  // Document classification
  documentType: {
    type: String,
    enum: [
      'clinical_note',
      'lab_result',
      'imaging_report',
      'pathology_report',
      'prescription',
      'consent_form',
      'insurance_card',
      'identification',
      'referral_letter',
      'discharge_summary',
      'operative_report',
      'progress_note',
      'consultation_report',
      'therapy_note',
      'nursing_note',
      'medication_list',
      'allergy_list',
      'immunization_record',
      'vital_signs_chart',
      'flow_sheet',
      'care_plan',
      'patient_photo',
      'wound_photo',
      'other'
    ],
    required: true,
    index: true
  },
  
  documentCategory: {
    type: String,
    enum: [
      'clinical',
      'administrative',
      'billing',
      'legal',
      'educational',
      'research',
      'quality_assurance',
      'compliance'
    ],
    required: true,
    default: 'clinical'
  },
  
  // Document content
  title: {
    type: String,
    required: true
  },
  
  description: {
    type: String,
    maxlength: 1000
  },
  
  keywords: [String],
  
  tags: [String],
  
  // Storage information
  storageLocation: {
    type: String,
    required: true
  },
  
  storagePath: {
    type: String,
    required: true
  },
  
  storageProvider: {
    type: String,
    enum: ['local', 'aws_s3', 'azure_blob', 'google_cloud', 'ftp'],
    default: 'local'
  },
  
  checksum: {
    type: String,
    required: true
  },
  
  // Document authoring
  author: {
    providerId: {
      type: String,
      required: true,
      index: true
    },
    providerName: String,
    providerRole: String,
    department: String
  },
  
  // Document dates
  createdDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  documentDate: {
    type: Date,
    required: true,
    index: true
  },
  
  lastModifiedDate: {
    type: Date,
    default: Date.now
  },
  
  // Document status
  status: {
    type: String,
    enum: [
      'draft',
      'pending_review',
      'reviewed',
      'approved',
      'rejected',
      'archived',
      'deleted'
    ],
    default: 'draft',
    index: true
  },
  
  // Version control
  version: {
    type: Number,
    default: 1
  },
  
  versionHistory: [{
    version: Number,
    modifiedDate: Date,
    modifiedBy: String,
    changes: String,
    previousChecksum: String
  }],
  
  // Access control and security
  accessLevel: {
    type: String,
    enum: ['public', 'internal', 'restricted', 'confidential'],
    default: 'internal'
  },
  
  permissions: {
    canView: [String],
    canEdit: [String],
    canDelete: [String],
    canShare: [String]
  },
  
  encryption: {
    isEncrypted: {
      type: Boolean,
      default: false
    },
    encryptionMethod: String,
    encryptionKey: String
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
    signatureData: String
  },
  
  // Review and approval workflow
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
  
  // OCR and text extraction
  textExtraction: {
    hasTextContent: {
      type: Boolean,
      default: false
    },
    extractedText: String,
    ocrConfidence: Number,
    ocrEngine: String,
    extractionDate: Date
  },
  
  // Image metadata (for image documents)
  imageMetadata: {
    width: Number,
    height: Number,
    resolution: String,
    colorDepth: Number,
    compression: String,
    exifData: mongoose.Schema.Types.Mixed
  },
  
  // PDF metadata (for PDF documents)
  pdfMetadata: {
    pageCount: Number,
    pdfVersion: String,
    hasBookmarks: Boolean,
    hasAnnotations: Boolean,
    isPasswordProtected: Boolean
  },
  
  // Clinical context
  clinicalContext: {
    relatedDiagnoses: [String],
    relatedProcedures: [String],
    bodyPart: String,
    laterality: {
      type: String,
      enum: ['left', 'right', 'bilateral', 'not_applicable']
    },
    urgency: {
      type: String,
      enum: ['routine', 'urgent', 'stat', 'emergency']
    }
  },
  
  // Integration and interoperability
  integration: {
    sourceSystem: String,
    externalDocumentId: String,
    fhirResourceId: String,
    hl7MessageId: String,
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'failed', 'not_applicable']
    },
    lastSyncDate: Date
  },
  
  // Quality and validation
  quality: {
    isValid: {
      type: Boolean,
      default: true
    },
    validationErrors: [String],
    qualityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    completenessScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // Compliance and retention
  compliance: {
    retentionPeriod: String,
    retentionDate: Date,
    legalHold: {
      type: Boolean,
      default: false
    },
    hipaaCompliant: {
      type: Boolean,
      default: true
    },
    auditTrail: [{
      action: String,
      userId: String,
      timestamp: Date,
      ipAddress: String,
      userAgent: String,
      details: String
    }]
  },
  
  // Sharing and distribution
  sharing: {
    isShared: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      recipientId: String,
      recipientName: String,
      recipientType: {
        type: String,
        enum: ['provider', 'patient', 'facility', 'insurance', 'legal']
      },
      sharedDate: Date,
      expirationDate: Date,
      accessLevel: String
    }],
    shareHistory: [{
      action: String,
      timestamp: Date,
      sharedBy: String,
      recipient: String
    }]
  },
  
  // Annotations and comments
  annotations: [{
    annotationId: String,
    annotationType: {
      type: String,
      enum: ['highlight', 'note', 'drawing', 'stamp', 'signature']
    },
    content: String,
    position: {
      page: Number,
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    author: String,
    createdDate: Date,
    isVisible: {
      type: Boolean,
      default: true
    }
  }],
  
  // Related documents
  relationships: [{
    relatedDocumentId: String,
    relationshipType: {
      type: String,
      enum: ['parent', 'child', 'sibling', 'reference', 'supersedes', 'superseded_by']
    },
    description: String
  }],
  
  // Backup and recovery
  backup: {
    isBackedUp: {
      type: Boolean,
      default: false
    },
    backupLocation: String,
    lastBackupDate: Date,
    backupFrequency: String
  }
}, {
  timestamps: true,
  collection: 'encounter_documents'
});

// Indexes for performance
encounterDocumentSchema.index({ encounterId: 1, createdDate: -1 });
encounterDocumentSchema.index({ documentType: 1, documentDate: -1 });
encounterDocumentSchema.index({ 'author.providerId': 1, createdDate: -1 });
encounterDocumentSchema.index({ status: 1, createdDate: -1 });
encounterDocumentSchema.index({ keywords: 1 });
encounterDocumentSchema.index({ tags: 1 });

// Pre-save middleware
encounterDocumentSchema.pre('save', function(next) {
  // Generate documentId if not provided
  if (!this.documentId) {
    this.documentId = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Update last modified date
  this.lastModifiedDate = new Date();
  
  // Extract file extension from filename
  if (!this.fileExtension && this.fileName) {
    const parts = this.fileName.split('.');
    this.fileExtension = parts.length > 1 ? parts.pop().toLowerCase() : '';
  }
  
  next();
});

// Instance methods
encounterDocumentSchema.methods.isSigned = function() {
  return this.signature.isSigned;
};

encounterDocumentSchema.methods.isApproved = function() {
  return this.review.approvalStatus === 'approved';
};

encounterDocumentSchema.methods.canBeModified = function() {
  return ['draft', 'pending_review', 'needs_revision'].includes(this.status) && !this.isSigned();
};

encounterDocumentSchema.methods.addAnnotation = function(annotationData) {
  this.annotations.push({
    annotationId: `ANN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    createdDate: new Date(),
    ...annotationData
  });
  return this.save();
};

encounterDocumentSchema.methods.shareWith = function(recipientData) {
  this.sharing.isShared = true;
  this.sharing.sharedWith.push({
    sharedDate: new Date(),
    ...recipientData
  });
  
  this.sharing.shareHistory.push({
    action: 'shared',
    timestamp: new Date(),
    sharedBy: recipientData.sharedBy,
    recipient: recipientData.recipientId
  });
  
  return this.save();
};

// Static methods
encounterDocumentSchema.statics.findByEncounter = function(encounterId) {
  return this.find({ encounterId }).sort({ createdDate: -1 });
};

encounterDocumentSchema.statics.findByType = function(documentType, limit = 50) {
  return this.find({ documentType })
    .sort({ documentDate: -1 })
    .limit(limit);
};

encounterDocumentSchema.statics.findByProvider = function(providerId, limit = 20) {
  return this.find({ 'author.providerId': providerId })
    .sort({ createdDate: -1 })
    .limit(limit);
};

encounterDocumentSchema.statics.findUnsigned = function() {
  return this.find({ 'signature.isSigned': false })
    .sort({ createdDate: 1 });
};

encounterDocumentSchema.statics.searchDocuments = function(searchTerm) {
  return this.find({
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { keywords: { $in: [new RegExp(searchTerm, 'i')] } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } },
      { 'textExtraction.extractedText': { $regex: searchTerm, $options: 'i' } }
    ]
  }).sort({ createdDate: -1 });
};

module.exports = mongoose.model('EncounterDocument', encounterDocumentSchema);
