/**
 * Clinical Notes Schema
 * Represents the documentation of a clinical encounter
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Subjective section schema
const SubjectiveSchema = new Schema({
  chiefComplaint: String,
  historyOfPresentIllness: String,
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
    skin: String
  },
  pastMedicalHistory: String,
  medications: String,
  allergies: String,
  familyHistory: String,
  socialHistory: String
});

// Vital signs schema
const VitalSignsSchema = new Schema({
  temperature: Number,
  heartRate: Number,
  respiratoryRate: Number,
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  oxygenSaturation: Number,
  weight: Number,
  height: Number,
  bmi: Number
});

// Physical exam schema
const PhysicalExamSchema = new Schema({
  general: String,
  heent: String,
  cardiovascular: String,
  respiratory: String,
  gastrointestinal: String,
  musculoskeletal: String,
  neurological: String,
  skin: String
});

// Objective section schema
const ObjectiveSchema = new Schema({
  vitalSigns: VitalSignsSchema,
  physicalExam: PhysicalExamSchema,
  labResults: [Schema.Types.Mixed],
  imagingResults: [Schema.Types.Mixed]
});

// Assessment section schema
const AssessmentSchema = new Schema({
  diagnoses: [Schema.Types.Mixed],
  differentialDiagnoses: [String],
  clinicalImpression: String
});

// Plan section schema
const PlanSchema = new Schema({
  diagnostics: [String],
  treatments: [String],
  medications: [Schema.Types.Mixed],
  patientEducation: [String],
  followUp: String,
  referrals: [String]
});

// Content schema (SOAP note)
const ContentSchema = new Schema({
  subjective: SubjectiveSchema,
  objective: ObjectiveSchema,
  assessment: AssessmentSchema,
  plan: PlanSchema
});

// Metadata schema
const MetadataSchema = new Schema({
  templateUsed: String,
  completionTime: Number,
  aiAssisted: Boolean,
  wordCount: Number,
  editCount: Number,
  editHistory: [Schema.Types.Mixed]
});

// Main clinical note schema
const ClinicalNoteSchema = new Schema({
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
  status: {
    type: String,
    enum: ['draft', 'signed', 'amended'],
    default: 'draft',
    index: true
  },
  noteType: {
    type: String,
    enum: ['soap', 'progress', 'procedure', 'discharge', 'referral', 'consultation'],
    default: 'soap',
    index: true
  },
  content: ContentSchema,
  rawTranscription: String,
  aiSummary: String,
  aiConfidenceScore: Number,
  signedBy: String,
  signedAt: Date,
  metadata: MetadataSchema,
  tags: [String],
  attachments: [Schema.Types.ObjectId],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Add index for full-text search
ClinicalNoteSchema.index({
  'content.subjective.chiefComplaint': 'text',
  'content.subjective.historyOfPresentIllness': 'text',
  'content.assessment.clinicalImpression': 'text',
  'content.plan.followUp': 'text',
  rawTranscription: 'text'
});

// Update the updatedAt field on save
ClinicalNoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = ClinicalNoteSchema;
