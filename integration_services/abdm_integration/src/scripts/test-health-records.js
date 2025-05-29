/**
 * Health Record Management Test Script
 * 
 * This script tests the health record management functionality
 * Run with: node src/scripts/test-health-records.js
 */

require('dotenv').config();
const { 
  testConnection, 
  syncModels, 
  HealthRecordFetchRequest, 
  HealthRecord, 
  HealthRecordProcessingLog,
  HealthRecordAccessLog,
  ConsentArtifact 
} = require('../models');
const { logger } = require('../utils/logger');

async function testHealthRecordManagement() {
  logger.info('Testing Health Record Management functionality...');
  
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      logger.error('Database connection failed');
      return;
    }
    
    logger.info('✅ Database connection successful');
    
    // Sync models
    await syncModels();
    logger.info('✅ Database models synchronized');
    
    // Create test consent artifact first
    const testConsentArtifact = await ConsentArtifact.create({
      consentRequestId: '123e4567-e89b-12d3-a456-426614174000',
      abdmArtifactId: 'test-consent-artifact-' + Date.now(),
      artifactData: {
        id: 'test-artifact-id',
        permission: {
          accessMode: 'VIEW',
          hiTypes: ['DiagnosticReport', 'Prescription'],
          dateRange: {
            from: '2024-01-01',
            to: '2024-12-31'
          },
          dataEraseAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      },
      status: 'ACTIVE',
      grantedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
    
    logger.info('✅ Test consent artifact created', {
      id: testConsentArtifact.id
    });
    
    // Test creating a health record fetch request
    const testFetchRequest = await HealthRecordFetchRequest.create({
      consentArtifactId: testConsentArtifact.id,
      patientId: '456e7890-e89b-12d3-a456-426614174001',
      doctorId: '789e0123-e89b-12d3-a456-426614174002',
      abdmRequestId: 'test-fetch-request-' + Date.now(),
      hiTypes: ['DiagnosticReport', 'Prescription'],
      dateRangeFrom: '2024-01-01',
      dateRangeTo: '2024-12-31',
      status: 'PROCESSING',
      totalRecords: 5,
      completedRecords: 0,
      failedRecords: 0
    });
    
    logger.info('✅ Health record fetch request created successfully', {
      id: testFetchRequest.id,
      abdmRequestId: testFetchRequest.abdmRequestId
    });
    
    // Test fetch request methods
    const isCompleted = testFetchRequest.isCompleted();
    const progress = testFetchRequest.getProgress();
    
    logger.info('✅ Fetch request methods working', {
      isCompleted,
      progress
    });
    
    // Test creating health records
    const testHealthRecord1 = await HealthRecord.create({
      patientId: testFetchRequest.patientId,
      fetchRequestId: testFetchRequest.id,
      abdmRecordId: 'test-diagnostic-report-' + Date.now(),
      recordType: 'DiagnosticReport',
      recordDate: '2024-01-15',
      providerId: 'test-lab-123',
      providerName: 'Test Laboratory',
      providerType: 'Laboratory',
      fhirResource: {
        resourceType: 'DiagnosticReport',
        id: 'diagnostic-report-1',
        status: 'final',
        code: {
          text: 'Blood Test Report',
          coding: [
            {
              display: 'Complete Blood Count'
            }
          ]
        },
        subject: {
          reference: 'Patient/patient-123'
        },
        effectiveDateTime: '2024-01-15T10:00:00Z',
        conclusion: 'Normal blood count values'
      },
      source: 'ABDM',
      status: 'ACTIVE'
    });
    
    const testHealthRecord2 = await HealthRecord.create({
      patientId: testFetchRequest.patientId,
      fetchRequestId: testFetchRequest.id,
      abdmRecordId: 'test-prescription-' + Date.now(),
      recordType: 'Prescription',
      recordDate: '2024-01-16',
      providerId: 'test-clinic-456',
      providerName: 'Test Clinic',
      providerType: 'Clinic',
      fhirResource: {
        resourceType: 'MedicationRequest',
        id: 'medication-request-1',
        status: 'active',
        medicationCodeableConcept: {
          text: 'Aspirin 100mg'
        },
        subject: {
          reference: 'Patient/patient-123'
        },
        authoredOn: '2024-01-16T10:00:00Z'
      },
      source: 'ABDM',
      status: 'ACTIVE'
    });
    
    logger.info('✅ Health records created successfully', {
      record1Id: testHealthRecord1.id,
      record2Id: testHealthRecord2.id
    });
    
    // Test health record methods
    const record1IsActive = testHealthRecord1.isActive();
    const record1Integrity = testHealthRecord1.verifyIntegrity();
    const record1DisplayInfo = testHealthRecord1.getDisplayInfo();
    
    logger.info('✅ Health record methods working', {
      isActive: record1IsActive,
      integrityValid: record1Integrity,
      displayInfo: record1DisplayInfo
    });
    
    // Test processing log
    await HealthRecordProcessingLog.logProcessing({
      fetchRequestId: testFetchRequest.id,
      healthRecordId: testHealthRecord1.id,
      abdmRecordId: testHealthRecord1.abdmRecordId,
      processingStage: 'STORE',
      status: 'SUCCESS',
      processingTimeMs: 150,
      details: {
        recordType: testHealthRecord1.recordType,
        provider: testHealthRecord1.providerName
      }
    });
    
    logger.info('✅ Processing log entry created successfully');
    
    // Test access log
    await HealthRecordAccessLog.logAccess({
      healthRecordId: testHealthRecord1.id,
      userId: testFetchRequest.doctorId,
      accessType: 'VIEW',
      ipAddress: '127.0.0.1',
      userAgent: 'test-script',
      details: {
        recordType: testHealthRecord1.recordType,
        source: testHealthRecord1.source
      }
    });
    
    logger.info('✅ Access log entry created successfully');
    
    // Test finding records by patient
    const patientRecords = await HealthRecord.findByPatient(testFetchRequest.patientId, {
      recordType: 'DiagnosticReport',
      limit: 10
    });
    
    logger.info('✅ Patient records retrieval successful', {
      recordCount: patientRecords.length
    });
    
    // Test getting record types
    const recordTypes = await HealthRecord.getRecordTypes(testFetchRequest.patientId);
    
    logger.info('✅ Record types retrieval successful', {
      typeCount: recordTypes.length
    });
    
    // Test updating fetch request progress
    await testFetchRequest.updateProgress(2, 0, 5);
    
    logger.info('✅ Fetch request progress updated', {
      status: testFetchRequest.status,
      progress: testFetchRequest.getProgress()
    });
    
    // Test processing stats
    const processingStats = await HealthRecordProcessingLog.getProcessingStats(testFetchRequest.id);
    
    logger.info('✅ Processing stats retrieval successful', {
      statsCount: processingStats.length
    });
    
    // Test access history
    const accessHistory = await HealthRecordAccessLog.getAccessHistory(testHealthRecord1.id);
    
    logger.info('✅ Access history retrieval successful', {
      accessCount: accessHistory.length
    });
    
    // Clean up test data
    await HealthRecordAccessLog.destroy({
      where: { healthRecordId: testHealthRecord1.id }
    });
    
    await HealthRecordProcessingLog.destroy({
      where: { fetchRequestId: testFetchRequest.id }
    });
    
    await testHealthRecord1.destroy();
    await testHealthRecord2.destroy();
    await testFetchRequest.destroy();
    await testConsentArtifact.destroy();
    
    logger.info('✅ Test data cleaned up successfully');
    logger.info('🎉 All health record management tests passed!');
    
  } catch (error) {
    logger.error('❌ Health record management test failed:', error);
  }
}

// Run the test
testHealthRecordManagement().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
