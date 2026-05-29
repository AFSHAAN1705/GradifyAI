#!/usr/bin/env node

/**
 * ValidatorAI API Endpoint Tests
 * Tests all major API endpoints
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(`${BASE_URL}${path}`);
      const options = {
        method,
        hostname: url.hostname,
        port: url.port || 5000,
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: parsed,
              rawBody: responseData
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: {},
              rawBody: responseData
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Test runner
async function testEndpoint(name, method, path, data = null, expectedStatus = 200, headers = {}) {
  try {
    console.log(`\n⏳ Testing: ${name}`);
    const response = await makeRequest(method, path, data, headers);
    
    const passed = response.status === expectedStatus || (expectedStatus === 'any' && response.status < 500);
    const status = passed ? '✅ PASS' : '❌ FAIL';
    
    console.log(`${status} - HTTP ${response.status} (expected ${expectedStatus})`);
    
    if (!passed) {
      console.log(`   Response: ${JSON.stringify(response.body).substring(0, 200)}`);
    }
    
    testResults.tests.push({
      name,
      method,
      path,
      status: response.status,
      expected: expectedStatus,
      passed
    });
    
    if (passed) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    return response;
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}`);
    testResults.tests.push({
      name,
      method,
      path,
      error: error.message,
      passed: false
    });
    testResults.failed++;
    return null;
  }
}

// Main test suite
async function runTests() {
  console.log('='.repeat(50));
  console.log('  ValidatorAI API Endpoint Tests');
  console.log('='.repeat(50));

  // 1. Health Check
  console.log('\n📋 Section 1: Health & Misc Endpoints');
  console.log('-'.repeat(50));
  await testEndpoint('Health Check', 'GET', '/health', null, 200);
  
  // 2. College Endpoints
  console.log('\n📋 Section 2: College Endpoints');
  console.log('-'.repeat(50));
  await testEndpoint('List Colleges', 'GET', '/api/colleges', null, 200);
  const collegesResp = await testEndpoint('List Colleges with Search', 'GET', '/api/colleges?search=BMS', null, 200);
  
  // Get a college ID for testing
  let collegeId = null;
  if (collegesResp && collegesResp.body && collegesResp.body.data && collegesResp.body.data.length > 0) {
    collegeId = collegesResp.body.data[0]._id || collegesResp.body.data[0].id;
    console.log(`   Using college ID: ${collegeId}`);
  }
  
  if (collegeId) {
    await testEndpoint('Get College Detail', 'GET', `/api/colleges/${collegeId}`, null, 200);
  }

  // 3. Cutoff Endpoints
  console.log('\n📋 Section 3: Cutoff Endpoints');
  console.log('-'.repeat(50));
  await testEndpoint(
    'Get Cutoffs',
    'GET',
    '/api/cutoffs?collegeCode=106&branchCode=CS&category=GM&round=1&year=2025',
    null,
    'any'
  );

  // 4. Authentication Endpoints
  console.log('\n📋 Section 4: Authentication Endpoints');
  console.log('-'.repeat(50));
  
  const signupData = {
    name: `TestUser${Date.now()}`,
    email: `testuser${Date.now()}@test.com`,
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!'
  };
  
  const signupResp = await testEndpoint(
    'Signup - New User',
    'POST',
    '/api/auth/signup',
    signupData,
    'any'
  );
  
  let authToken = null;
  if (signupResp && signupResp.body && signupResp.body.token) {
    authToken = signupResp.body.token;
    console.log(`   ✓ Got auth token from signup`);
  }

  const loginData = {
    email: signupData.email,
    password: signupData.password
  };

  const loginResp = await testEndpoint(
    'Login - Valid Credentials',
    'POST',
    '/api/auth/login',
    loginData,
    'any'
  );
  
  if (loginResp && loginResp.body && loginResp.body.token) {
    authToken = loginResp.body.token;
    console.log(`   ✓ Got auth token from login`);
  }

  if (authToken) {
    await testEndpoint(
      'Get Current User (Me)',
      'GET',
      '/api/auth/me',
      null,
      200,
      { 'Authorization': `Bearer ${authToken}` }
    );

    await testEndpoint(
      'Logout',
      'POST',
      '/api/auth/logout',
      {},
      'any',
      { 'Authorization': `Bearer ${authToken}` }
    );
  }

  // 5. Prediction Endpoint
  console.log('\n📋 Section 5: Prediction Endpoint');
  console.log('-'.repeat(50));
  
  const predictionData = {
    rank: 5000,
    category: 'GM',
    branch: 'CS',
    round: 1,
    year: 2025
  };
  
  await testEndpoint(
    'Predict Admission',
    'POST',
    '/api/predict',
    predictionData,
    'any'
  );

  // 6. AI Endpoints
  console.log('\n📋 Section 6: AI Endpoints');
  console.log('-'.repeat(50));
  
  const counsellingData = {
    rank: 5000,
    category: 'GM',
    interests: ['CS', 'IT'],
    preferredLocation: 'Bangalore'
  };
  
  await testEndpoint(
    'AI Counselling',
    'POST',
    '/api/ai/counsel',
    counsellingData,
    'any'
  );

  const compareData = {
    colleges: ['college1', 'college2'],
    branch: 'CS',
    category: 'GM'
  };
  
  await testEndpoint(
    'AI Compare',
    'POST',
    '/api/ai/compare',
    compareData,
    'any'
  );

  // 7. Reviews and Placements
  console.log('\n📋 Section 7: Reviews & Placements');
  console.log('-'.repeat(50));
  
  await testEndpoint(
    'List Reviews',
    'GET',
    '/reviews',
    null,
    200
  );

  await testEndpoint(
    'List Placements',
    'GET',
    '/placements',
    null,
    200
  );

  await testEndpoint(
    'List Trends',
    'GET',
    '/trends',
    null,
    200
  );

  // 8. Chat Endpoints
  console.log('\n📋 Section 8: AI Chat Endpoints');
  console.log('-'.repeat(50));
  
  await testEndpoint(
    'List AI Chats',
    'GET',
    '/ai-chats',
    null,
    'any'
  );

  // 9. Admin Endpoints (may fail without admin role)
  console.log('\n📋 Section 9: Admin Endpoints');
  console.log('-'.repeat(50));
  
  if (authToken) {
    await testEndpoint(
      'Admin Dashboard Stats',
      'GET',
      '/api/admin/dashboard/stats',
      null,
      'any',
      { 'Authorization': `Bearer ${authToken}` }
    );

    await testEndpoint(
      'Admin List Colleges',
      'GET',
      '/api/admin/colleges',
      null,
      'any',
      { 'Authorization': `Bearer ${authToken}` }
    );

    await testEndpoint(
      'Admin List Categories',
      'GET',
      '/api/admin/categories',
      null,
      'any',
      { 'Authorization': `Bearer ${authToken}` }
    );

    await testEndpoint(
      'Admin List Branches',
      'GET',
      '/api/admin/branches',
      null,
      'any',
      { 'Authorization': `Bearer ${authToken}` }
    );

    await testEndpoint(
      'Admin List Cutoffs',
      'GET',
      '/api/admin/cutoffs',
      null,
      'any',
      { 'Authorization': `Bearer ${authToken}` }
    );

    await testEndpoint(
      'Admin List Users',
      'GET',
      '/api/admin/users',
      null,
      'any',
      { 'Authorization': `Bearer ${authToken}` }
    );

    await testEndpoint(
      'Admin List Predictions',
      'GET',
      '/api/admin/predictions',
      null,
      'any',
      { 'Authorization': `Bearer ${authToken}` }
    );

    await testEndpoint(
      'Admin List Import Logs',
      'GET',
      '/api/admin/import-logs',
      null,
      'any',
      { 'Authorization': `Bearer ${authToken}` }
    );
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('  Test Results Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total:  ${testResults.passed + testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  console.log('\n📝 Detailed Results:');
  console.log('-'.repeat(50));
  testResults.tests.forEach((test, idx) => {
    const status = test.passed ? '✅' : '❌';
    const details = test.error ? ` [Error: ${test.error}]` : ` [${test.method} ${test.path}]`;
    console.log(`${idx + 1}. ${status} ${test.name}${details}`);
  });

  console.log('\n' + '='.repeat(50));
  if (testResults.failed === 0) {
    console.log('✨ All tests passed!');
  } else {
    console.log(`⚠️  ${testResults.failed} test(s) failed`);
  }
  console.log('='.repeat(50) + '\n');

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
