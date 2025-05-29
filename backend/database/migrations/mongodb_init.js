/**
 * MongoDB Initial Setup Script
 * This script initializes the MongoDB collections and indexes
 */

// Create collections
db.createCollection('clinicalNotes');
db.createCollection('voiceRecordings');
db.createCollection('fs.files');
db.createCollection('fs.chunks');

// Create indexes for clinicalNotes collection
db.clinicalNotes.createIndex({ encounterId: 1 });
db.clinicalNotes.createIndex({ patientId: 1 });
db.clinicalNotes.createIndex({ doctorId: 1 });
db.clinicalNotes.createIndex({ status: 1 });
db.clinicalNotes.createIndex({ noteType: 1 });
db.clinicalNotes.createIndex({ createdAt: 1 });
db.clinicalNotes.createIndex({ updatedAt: 1 });
db.clinicalNotes.createIndex({ 
  'content.subjective.chiefComplaint': 'text',
  'content.subjective.historyOfPresentIllness': 'text',
  'content.assessment.clinicalImpression': 'text',
  'content.plan.followUp': 'text',
  rawTranscription: 'text'
});

// Create indexes for voiceRecordings collection
db.voiceRecordings.createIndex({ encounterId: 1 });
db.voiceRecordings.createIndex({ patientId: 1 });
db.voiceRecordings.createIndex({ doctorId: 1 });
db.voiceRecordings.createIndex({ status: 1 });
db.voiceRecordings.createIndex({ createdAt: 1 });
db.voiceRecordings.createIndex({ encounterId: 1, createdAt: -1 });
db.voiceRecordings.createIndex({ patientId: 1, createdAt: -1 });
db.voiceRecordings.createIndex({ doctorId: 1, createdAt: -1 });
db.voiceRecordings.createIndex({ 'retentionPolicy.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Create indexes for GridFS collections
db.fs.files.createIndex({ filename: 1 });
db.fs.files.createIndex({ uploadDate: 1 });
db.fs.chunks.createIndex({ files_id: 1, n: 1 }, { unique: true });
