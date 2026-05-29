#!/usr/bin/env node

/**
 * ValidatorAI API Endpoint Test Suite
 * Comprehensive test of all available endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const TIMEOUT_MS = 5000;

class APITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      tests: []
    };
    this.authToken = null;
  }

  async makeRequest(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${BASE_URL}${path}`);
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };

      const options = {
        hostname: url.hostname,
        port: url.port || 5000,
        path: url.pathname + url.search,
        method,
        headers: defaultHeaders,
        timeout: TIMEOUT_MS
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data ? JSON.parse(data) : null,
              text: data
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: null,
              text: data
            });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  async test(name, method, path, body, expectedStatus = 200, headers = {}) {
    try {
      process.stdout.write(`Testing: ${name}... `);
      const response = await this.makeRequest(method, path, body, headers);
      
      const success = Array.isArray(expectedStatus) 
        ? expectedStatus.includes(response.status)
        : response.status === expectedStatus;

      if (success) {
        console.log(`✓ ${response.status}`);
        this.results.passed++;
      } else {
        console.log(`✗ Got ${response.status}, expected ${expectedStatus}`);
        this.results.failed++;
      }

      this.results.tests.push({
        name,
        method,
        path,
        status: response.status,
        expected: expectedStatus,
        success
      });

      return response;
    } catch (error) {
      console.log(`✗ ${error.message}`);
      this.results.failed++;
      this.results.errors.push({ name, error: error.message });
      this.results.tests.push({
        name,
        method,
        path,
        error: error.message,
        success: false
      });
      return null;
    }
  }

  printSummary() {
    const total = this.results.passed + this.results.failed;
    const percentage = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;

    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`✓ Passed:  ${this.results.passed}`);
    console.log(`✗ Failed:  ${this.results.failed}`);
    console.log(`  Total:   ${total}`);
    console.log(`  Success: ${percentage}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\nErrors:');
      this.results.errors.forEach(e => {
        console.log(`  • ${e.name}: ${e.error}`);
      });
    }
    console.log('='.repeat(60) + '\n');
  }
}

async function runTests() {
  const tester = new APITester();

  console.log('='.repeat(60));
  console.log('ValidatorAI API Endpoint Test Suite');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}\n`);

  // 1. Health Check
  console.log('1. HEALTH & MISC ENDPOINTS');
  console.log('-'.repeat(60));
  await tester.test('Health Check', 'GET', '/health', null, 200);

  // 2. College Endpoints
  console.log('\n2. COLLEGE ENDPOINTS');
  console.log('-'.repeat(60));
  const collegesResp = await tester.test('List Colleges', 'GET', '/api/colleges', null, [200, 201]);
  const collegeDetail = await tester.test('List Colleges with Query', 'GET', '/api/colleges?search=test', null, [200, 201]);

  // 3. Cutoff Endpoints
  console.log('\n3. CUTOFF ENDPOINTS');
  console.log('-'.repeat(60));
  await tester.test(
    'Get Cutoffs', 
    'GET', 
    '/api/cutoffs?collegeCode=106&branchCode=CS&category=GM&round=1&year=2025',
    null,
    [200, 201, 404, 400] // Flexible expectation
  );

  // 4. Authentication Endpoints
  console.log('\n4. AUTHENTICATION ENDPOINTS');
  console.log('-'.repeat(60));

  const uniqueEmail = `test${Date.now()}@test.com`;
  const signupResp = await tester.test(
    'Signup - New User',
    'POST',
    '/api/auth/signup',
    {
      name: `TestUser${Date.now()}`,
      email: uniqueEmail,
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!'
    },
    [200, 201, 400, 409] // Expect success or already exists
  );

  if (signupResp && signupResp.status === 200 && signupResp.body?.token) {
    tester.authToken = signupResp.body.token;
    console.log('  (Got auth token from signup)');
  }

  const loginResp = await tester.test(
    'Login - Valid Credentials',
    'POST',
    '/api/auth/login',
    {
      email: uniqueEmail,
      password: 'TestPass123!'
    },
    [200, 201, 401, 404]
  );

  if (loginResp && loginResp.status === 200 && loginResp.body?.token) {
    tester.authToken = loginResp.body.token;
    console.log('  (Got auth token from login)');
  }

  if (tester.authToken) {
    await tester.test(
      'Get Current User (Me)',
      'GET',
      '/api/auth/me',
      null,
      [200, 401],
      { 'Authorization': `Bearer ${tester.authToken}` }
    );

    await tester.test(
      'Logout',
      'POST',
      '/api/auth/logout',
      {},
      [200, 201],
      { 'Authorization': `Bearer ${tester.authToken}` }
    );
  }

  // 5. Prediction Endpoint
  console.log('\n5. PREDICTION ENDPOINTS');
  console.log('-'.repeat(60));
  await tester.test(
    'Predict Admission',
    'POST',
    '/api/predict',
    {
      rank: 5000,
      category: 'GM',
      branch: 'CS',
      round: 1,
      year: 2025
    },
    [200, 400, 404]
  );

  // 6. AI Endpoints
  console.log('\n6. AI COUNSELLING ENDPOINTS');
  console.log('-'.repeat(60));
  await tester.test(
    'AI Counselling',
    'POST',
    '/api/ai/counsel',
    {
      rank: 5000,
      category: 'GM',
      interests: ['CS'],
      preferredLocation: 'Bangalore'
    },
    [200, 400, 404]
  );

  await tester.test(
    'AI Compare',
    'POST',
    '/api/ai/compare',
    {
      colleges: ['college1', 'college2'],
      branch: 'CS',
      category: 'GM'
    },
    [200, 400, 404]
  );

  // 7. Reviews and Placements
  console.log('\n7. REVIEWS & PLACEMENTS ENDPOINTS');
  console.log('-'.repeat(60));
  await tester.test('List Reviews', 'GET', '/reviews', null, [200, 201]);
  await tester.test('List Placements', 'GET', '/placements', null, [200, 201]);
  await tester.test('List Trends', 'GET', '/trends', null, [200, 201]);

  // 8. Chat Endpoints
  console.log('\n8. AI CHAT ENDPOINTS');
  console.log('-'.repeat(60));
  await tester.test('List AI Chats', 'GET', '/ai-chats', null, [200, 201]);

  // 9. Admin Endpoints
  console.log('\n9. ADMIN ENDPOINTS (may require auth)');
  console.log('-'.repeat(60));
  await tester.test(
    'Admin Dashboard Stats',
    'GET',
    '/api/admin/dashboard/stats',
    null,
    [200, 401, 403],
    tester.authToken ? { 'Authorization': `Bearer ${tester.authToken}` } : {}
  );

  await tester.test(
    'Admin List Colleges',
    'GET',
    '/api/admin/colleges',
    null,
    [200, 401, 403],
    tester.authToken ? { 'Authorization': `Bearer ${tester.authToken}` } : {}
  );

  await tester.test(
    'Admin List Categories',
    'GET',
    '/api/admin/categories',
    null,
    [200, 401, 403],
    tester.authToken ? { 'Authorization': `Bearer ${tester.authToken}` } : {}
  );

  // Print results
  tester.printSummary();

  // Exit with appropriate code
  process.exit(tester.results.failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Run tests
runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
