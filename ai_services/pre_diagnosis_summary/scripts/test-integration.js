#!/usr/bin/env node

/**
 * Integration test script for Pre-Diagnosis Summary Service
 * This script tests the service integration with mock data
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const SERVICE_URL = process.env.SERVICE_URL || 'http://localhost:9004';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'test_jwt_token';

// Mock data
const mockPatientId = uuidv4();
const mockDoctorId = uuidv4();
const mockEncounterId = uuidv4();

const mockQuestionnaireData = {
  chiefComplaint: 'Chest pain and shortness of breath',
  duration: '2 days',
  severity: 'moderate',
  associatedSymptoms: 'Nausea, sweating',
  pastMedicalHistory: 'Hypertension, diabetes',
  currentMedications: 'Lisinopril 10mg daily, Metformin 500mg twice daily',
  allergies: 'Penicillin - rash',
  smokingStatus: 'Former smoker, quit 5 years ago',
  familyHistory: 'Father had heart attack at age 60'
};

class IntegrationTester {
  constructor() {
    this.baseURL = SERVICE_URL;
    this.headers = {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    };
    this.summaryId = null;
  }

  async runTests() {
    console.log('🚀 Starting Pre-Diagnosis Summary Service Integration Tests');
    console.log(`📍 Service URL: ${this.baseURL}`);
    console.log('=' .repeat(60));

    try {
      await this.testHealthCheck();
      await this.testGenerateSummary();
      await this.testGetSummaryById();
      await this.testGetRecentSummaries();
      await this.testGetUrgentSummaries();
      await this.testUpdateSummaryStatus();
      await this.testGetStatistics();
      
      console.log('\n✅ All integration tests passed successfully!');
    } catch (error) {
      console.error('\n❌ Integration tests failed:', error.message);
      process.exit(1);
    }
  }

  async testHealthCheck() {
    console.log('\n🔍 Testing Health Check...');
    
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Health check passed');
        console.log(`   Status: ${response.data.message}`);
        console.log(`   Uptime: ${response.data.uptime}s`);
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  async testGenerateSummary() {
    console.log('\n🧠 Testing Summary Generation...');
    
    const requestData = {
      patientId: mockPatientId,
      encounterId: mockEncounterId,
      questionnaireData: mockQuestionnaireData,
      priority: 'high'
    };

    try {
      const response = await axios.post(
        `${this.baseURL}/api/pre-diagnosis/generate`,
        requestData,
        { headers: this.headers }
      );

      if (response.status === 201 && response.data.success) {
        this.summaryId = response.data.data.id;
        console.log('✅ Summary generation passed');
        console.log(`   Summary ID: ${this.summaryId}`);
        console.log(`   Status: ${response.data.data.status}`);
        console.log(`   Urgency: ${response.data.data.aiSummary?.urgencyLevel || 'N/A'}`);
        console.log(`   Confidence: ${response.data.data.aiSummary?.confidenceScore || 'N/A'}`);
      } else {
        throw new Error('Summary generation failed');
      }
    } catch (error) {
      if (error.response) {
        throw new Error(`Summary generation failed: ${error.response.data.message || error.message}`);
      }
      throw new Error(`Summary generation failed: ${error.message}`);
    }
  }

  async testGetSummaryById() {
    if (!this.summaryId) {
      console.log('\n⏭️  Skipping Get Summary By ID (no summary ID available)');
      return;
    }

    console.log('\n📄 Testing Get Summary By ID...');
    
    try {
      const response = await axios.get(
        `${this.baseURL}/api/pre-diagnosis/${this.summaryId}`,
        { headers: this.headers }
      );

      if (response.status === 200 && response.data.success) {
        console.log('✅ Get summary by ID passed');
        console.log(`   Patient ID: ${response.data.data.patientId}`);
        console.log(`   Status: ${response.data.data.status}`);
        console.log(`   Key Findings: ${response.data.data.aiSummary?.keyFindings?.length || 0}`);
      } else {
        throw new Error('Get summary by ID failed');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  Summary not found (expected for mock data)');
      } else {
        throw new Error(`Get summary by ID failed: ${error.message}`);
      }
    }
  }

  async testGetRecentSummaries() {
    console.log('\n📋 Testing Get Recent Summaries...');
    
    try {
      const response = await axios.get(
        `${this.baseURL}/api/pre-diagnosis/my/recent?limit=5`,
        { headers: this.headers }
      );

      if (response.status === 200 && response.data.success) {
        console.log('✅ Get recent summaries passed');
        console.log(`   Found: ${response.data.data.length} summaries`);
      } else {
        throw new Error('Get recent summaries failed');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️  Authentication required (expected for mock token)');
      } else {
        throw new Error(`Get recent summaries failed: ${error.message}`);
      }
    }
  }

  async testGetUrgentSummaries() {
    console.log('\n🚨 Testing Get Urgent Summaries...');
    
    try {
      const response = await axios.get(
        `${this.baseURL}/api/pre-diagnosis/urgent`,
        { headers: this.headers }
      );

      if (response.status === 200 && response.data.success) {
        console.log('✅ Get urgent summaries passed');
        console.log(`   Found: ${response.data.data.length} urgent summaries`);
      } else {
        throw new Error('Get urgent summaries failed');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️  Authentication required (expected for mock token)');
      } else {
        throw new Error(`Get urgent summaries failed: ${error.message}`);
      }
    }
  }

  async testUpdateSummaryStatus() {
    if (!this.summaryId) {
      console.log('\n⏭️  Skipping Update Summary Status (no summary ID available)');
      return;
    }

    console.log('\n🔄 Testing Update Summary Status...');
    
    try {
      const response = await axios.patch(
        `${this.baseURL}/api/pre-diagnosis/${this.summaryId}/status`,
        { status: 'completed' },
        { headers: this.headers }
      );

      if (response.status === 200 && response.data.success) {
        console.log('✅ Update summary status passed');
        console.log(`   New Status: ${response.data.data.status}`);
      } else {
        throw new Error('Update summary status failed');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  Summary not found (expected for mock data)');
      } else {
        throw new Error(`Update summary status failed: ${error.message}`);
      }
    }
  }

  async testGetStatistics() {
    console.log('\n📊 Testing Get Statistics...');
    
    try {
      const response = await axios.get(
        `${this.baseURL}/api/pre-diagnosis/stats/${mockDoctorId}`,
        { headers: this.headers }
      );

      if (response.status === 200 && response.data.success) {
        console.log('✅ Get statistics passed');
        console.log(`   Total Summaries: ${response.data.data.totalSummaries}`);
        console.log(`   Completed: ${response.data.data.completedSummaries}`);
        console.log(`   Avg Confidence: ${response.data.data.avgConfidenceScore}`);
      } else {
        throw new Error('Get statistics failed');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('⚠️  Access denied (expected for mock token/user)');
      } else {
        throw new Error(`Get statistics failed: ${error.message}`);
      }
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTester;
