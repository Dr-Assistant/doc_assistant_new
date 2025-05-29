/**
 * Consent Management Test Script
 * 
 * This script tests the consent management functionality
 * Run with: node src/scripts/test-consent.js
 */

require('dotenv').config();
const { testConnection, syncModels, ConsentRequest, ConsentArtifact, ConsentAuditLog } = require('../models');
const { logger } = require('../utils/logger');

async function testConsentManagement() {
  logger.info('Testing Consent Management functionality...');
  
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
    
    // Test creating a consent request
    const testConsentRequest = await ConsentRequest.create({
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      doctorId: '456e7890-e89b-12d3-a456-426614174001',
      abdmRequestId: 'test-abdm-request-' + Date.now(),
      purposeCode: 'CAREMGT',
      purposeText: 'Care Management',
      hiTypes: ['DiagnosticReport', 'Prescription'],
      dateRangeFrom: '2024-01-01',
      dateRangeTo: '2024-12-31',
      expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      hips: ['test-hip-1'],
      status: 'REQUESTED'
    });
    
    logger.info('✅ Consent request created successfully', {
      id: testConsentRequest.id,
      abdmRequestId: testConsentRequest.abdmRequestId
    });
    
    // Test creating an audit log entry
    await ConsentAuditLog.logAction({
      consentRequestId: testConsentRequest.id,
      action: 'CONSENT_REQUESTED',
      actorId: testConsentRequest.doctorId,
      actorType: 'doctor',
      details: {
        purpose: testConsentRequest.purposeText,
        hiTypes: testConsentRequest.hiTypes
      },
      ipAddress: '127.0.0.1',
      userAgent: 'test-script'
    });
    
    logger.info('✅ Audit log entry created successfully');
    
    // Test finding consent request
    const foundRequest = await ConsentRequest.findByPk(testConsentRequest.id);
    if (foundRequest) {
      logger.info('✅ Consent request retrieval successful');
    } else {
      logger.error('❌ Failed to retrieve consent request');
    }
    
    // Test consent request methods
    const isExpired = foundRequest.isExpired();
    const canBeRevoked = foundRequest.canBeRevoked();
    
    logger.info('✅ Consent request methods working', {
      isExpired,
      canBeRevoked
    });
    
    // Test creating a consent artifact
    const testArtifact = await ConsentArtifact.create({
      consentRequestId: testConsentRequest.id,
      abdmArtifactId: 'test-artifact-' + Date.now(),
      artifactData: {
        id: 'test-artifact-id',
        permission: {
          accessMode: 'VIEW',
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
    
    logger.info('✅ Consent artifact created successfully', {
      id: testArtifact.id,
      abdmArtifactId: testArtifact.abdmArtifactId
    });
    
    // Test artifact methods
    const artifactIsExpired = testArtifact.isExpired();
    const artifactIsActive = testArtifact.isActive();
    
    logger.info('✅ Consent artifact methods working', {
      isExpired: artifactIsExpired,
      isActive: artifactIsActive
    });
    
    // Test getting audit trail
    const auditTrail = await ConsentAuditLog.getAuditTrail(testConsentRequest.id);
    logger.info('✅ Audit trail retrieval successful', {
      auditEntries: auditTrail.length
    });
    
    // Test finding active consents by patient
    const activeConsents = await ConsentRequest.findActiveByPatient(testConsentRequest.patientId);
    logger.info('✅ Active consents retrieval successful', {
      activeConsents: activeConsents.length
    });
    
    // Clean up test data
    await testArtifact.destroy();
    await ConsentAuditLog.destroy({
      where: { consentRequestId: testConsentRequest.id }
    });
    await testConsentRequest.destroy();
    
    logger.info('✅ Test data cleaned up successfully');
    logger.info('🎉 All consent management tests passed!');
    
  } catch (error) {
    logger.error('❌ Consent management test failed:', error);
  }
}

// Run the test
testConsentManagement().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
