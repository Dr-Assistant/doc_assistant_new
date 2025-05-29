#!/usr/bin/env node

/**
 * Voice Recording Service Integration Test
 * Tests the complete functionality of the voice recording service
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8013';
const AUTH_URL = 'http://localhost:8020';

// Test configuration
const testConfig = {
  baseURL: BASE_URL,
  authURL: AUTH_URL,
  timeout: 30000
};

// Test user credentials
const testUser = {
  username: 'testdoctor',
  password: 'TestPassword123!'
};

let authToken = null;

/**
 * Utility function to log test results
 */
function logTest(testName, success, message = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}${message ? ': ' + message : ''}`);
}

/**
 * Authenticate with the auth service
 */
async function authenticate() {
  try {
    console.log('\n🔐 Testing Authentication...');
    
    const response = await axios.post(`${testConfig.authURL}/api/auth/login`, {
      username: testUser.username,
      password: testUser.password
    });

    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      logTest('Authentication', true, 'Successfully obtained auth token');
      return true;
    } else {
      logTest('Authentication', false, 'Failed to get auth token');
      return false;
    }
  } catch (error) {
    logTest('Authentication', false, error.message);
    return false;
  }
}

/**
 * Test health endpoints
 */
async function testHealthEndpoints() {
  console.log('\n🏥 Testing Health Endpoints...');
  
  try {
    // Test main health endpoint
    const healthResponse = await axios.get(`${testConfig.baseURL}/health`);
    const isHealthy = healthResponse.data.status === 'healthy';
    logTest('Health Check', isHealthy, `Status: ${healthResponse.data.status}`);

    // Test readiness endpoint
    const readyResponse = await axios.get(`${testConfig.baseURL}/health/ready`);
    const isReady = readyResponse.data.ready === true;
    logTest('Readiness Check', isReady, `Ready: ${readyResponse.data.ready}`);

    // Test liveness endpoint
    const liveResponse = await axios.get(`${testConfig.baseURL}/health/live`);
    const isAlive = liveResponse.data.alive === true;
    logTest('Liveness Check', isAlive, `Alive: ${liveResponse.data.alive}`);

    return isHealthy && isReady && isAlive;
  } catch (error) {
    logTest('Health Endpoints', false, error.message);
    return false;
  }
}

/**
 * Test API documentation endpoint
 */
async function testApiDocumentation() {
  console.log('\n📚 Testing API Documentation...');
  
  try {
    const response = await axios.get(`${testConfig.baseURL}/api/docs`);
    const hasEndpoints = response.data.endpoints && Object.keys(response.data.endpoints).length > 0;
    logTest('API Documentation', hasEndpoints, `Found ${Object.keys(response.data.endpoints || {}).length} endpoints`);
    return hasEndpoints;
  } catch (error) {
    logTest('API Documentation', false, error.message);
    return false;
  }
}

/**
 * Test authentication middleware
 */
async function testAuthenticationMiddleware() {
  console.log('\n🔒 Testing Authentication Middleware...');
  
  try {
    // Test without token
    try {
      await axios.post(`${testConfig.baseURL}/api/voice-recordings`);
      logTest('No Token Rejection', false, 'Should have rejected request without token');
    } catch (error) {
      const isUnauthorized = error.response?.status === 401;
      logTest('No Token Rejection', isUnauthorized, `Status: ${error.response?.status}`);
    }

    // Test with invalid token
    try {
      await axios.post(`${testConfig.baseURL}/api/voice-recordings`, {}, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      logTest('Invalid Token Rejection', false, 'Should have rejected invalid token');
    } catch (error) {
      const isUnauthorized = error.response?.status === 401;
      logTest('Invalid Token Rejection', isUnauthorized, `Status: ${error.response?.status}`);
    }

    return true;
  } catch (error) {
    logTest('Authentication Middleware', false, error.message);
    return false;
  }
}

/**
 * Test voice recording validation endpoint
 */
async function testValidationEndpoint() {
  console.log('\n✅ Testing Validation Endpoint...');
  
  try {
    if (!authToken) {
      logTest('Validation Endpoint', false, 'No auth token available');
      return false;
    }

    const response = await axios.get(`${testConfig.baseURL}/api/voice-recordings/validation/info`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const hasValidationInfo = response.data.success && response.data.data;
    logTest('Validation Info', hasValidationInfo, 'Retrieved validation limits and formats');
    return hasValidationInfo;
  } catch (error) {
    logTest('Validation Endpoint', false, error.message);
    return false;
  }
}

/**
 * Test transcription endpoints
 */
async function testTranscriptionEndpoints() {
  console.log('\n🎤 Testing Transcription Endpoints...');
  
  try {
    if (!authToken) {
      logTest('Transcription Endpoints', false, 'No auth token available');
      return false;
    }

    // Test transcription stats endpoint
    const statsResponse = await axios.get(`${testConfig.baseURL}/api/transcriptions/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const hasStats = statsResponse.data.success;
    logTest('Transcription Stats', hasStats, 'Retrieved transcription statistics');
    return hasStats;
  } catch (error) {
    logTest('Transcription Endpoints', false, error.message);
    return false;
  }
}

/**
 * Run all integration tests
 */
async function runIntegrationTests() {
  console.log('🚀 Starting Voice Recording Service Integration Tests...\n');
  
  const results = {
    health: false,
    docs: false,
    auth: false,
    authMiddleware: false,
    validation: false,
    transcription: false
  };

  // Test health endpoints
  results.health = await testHealthEndpoints();

  // Test API documentation
  results.docs = await testApiDocumentation();

  // Authenticate
  results.auth = await authenticate();

  // Test authentication middleware
  results.authMiddleware = await testAuthenticationMiddleware();

  // Test validation endpoint
  results.validation = await testValidationEndpoint();

  // Test transcription endpoints
  results.transcription = await testTranscriptionEndpoints();

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    logTest(test.charAt(0).toUpperCase() + test.slice(1), passed);
  });

  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All integration tests passed! Voice Recording Service is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the service configuration.');
  }

  return passedTests === totalTests;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Integration test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runIntegrationTests };
