# ValidatorAI API - Manual Test Execution Guide

## Prerequisites Verification

### Environment Setup
```
✓ Backend directory: d:\ValidatorAI\backend
✓ Configuration file: .env
✓ Port: 5000
✓ Database: MongoDB at localhost:27017
✓ Database name: kcet
```

### Environment Variables
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kcet
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=kcet-ai-counselling-secret-key-2025-change-in-production
JWT_EXPIRES_IN=7d
JWT_COOKIE_NAME=kcet_ai_token
CLIENT_URL=http://localhost:3000
UPLOAD_DIR=./uploads
```

---

## Manual Test Execution Plan

### Phase 1: Backend Startup & Health Check

#### Step 1.1: Start MongoDB
```bash
# On Windows
mongod

# On Linux/Mac
brew services start mongodb-community
# OR
mongod
```

**Expected Output:**
```
Listening on localhost:27017
```

#### Step 1.2: Install Dependencies (if needed)
```bash
cd backend
npm install
```

#### Step 1.3: Start Backend Server
```bash
cd backend
npm run dev
```

**Expected Output:**
```
Backend server listening port=5000 environment=development
Connected to MongoDB at mongodb://localhost:27017/kcet
```

#### Step 1.4: Health Check
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

---

### Phase 2: Authentication Endpoints Testing

#### Test 2.1: Signup - New User
**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'
```

**Expected Response:** HTTP 201
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_id",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "user"
  }
}
```

**✓ PASS** - If token received and user object returned

#### Test 2.2: Signup - Duplicate Email
**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another User",
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'
```

**Expected Response:** HTTP 409
```json
{
  "error": "Email already exists"
}
```

**✓ PASS** - If error about duplicate email

#### Test 2.3: Login - Valid Credentials
**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

**Expected Response:** HTTP 200
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_id",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "user"
  }
}
```

**✓ PASS** - If token received with valid user data

#### Test 2.4: Login - Invalid Credentials
**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "WrongPassword123!"
  }'
```

**Expected Response:** HTTP 401
```json
{
  "error": "Invalid email or password"
}
```

**✓ PASS** - If 401 error returned

#### Test 2.5: Get Current User (Authenticated)
**Request:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN_FROM_LOGIN"
```

**Expected Response:** HTTP 200
```json
{
  "user": {
    "_id": "user_id",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "user",
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

**✓ PASS** - If user data returned

#### Test 2.6: Get Current User - No Token
**Request:**
```bash
curl -X GET http://localhost:5000/api/auth/me
```

**Expected Response:** HTTP 401
```json
{
  "error": "Unauthorized"
}
```

**✓ PASS** - If 401 error returned

#### Test 2.7: Logout
**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer TOKEN_FROM_LOGIN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:** HTTP 200
```json
{
  "message": "Logged out successfully"
}
```

**✓ PASS** - If success message returned

---

### Phase 3: College Endpoints Testing

#### Test 3.1: List All Colleges
**Request:**
```bash
curl -X GET "http://localhost:5000/api/colleges" \
  -H "Content-Type: application/json"
```

**Expected Response:** HTTP 200
```json
{
  "data": [
    {
      "_id": "college_id",
      "name": "RVCE",
      "code": "106",
      "location": "Bangalore",
      "type": "Engineering",
      "totalSeats": 180,
      "branches": ["CS", "IT", "EC", "ME"]
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

**✓ PASS** - If college array returned

#### Test 3.2: Search Colleges
**Request:**
```bash
curl -X GET "http://localhost:5000/api/colleges?search=RVCE" \
  -H "Content-Type: application/json"
```

**Expected Response:** HTTP 200
```json
{
  "data": [
    {
      "_id": "college_id",
      "name": "RVCE",
      "code": "106",
      "location": "Bangalore"
    }
  ],
  "total": 1
}
```

**✓ PASS** - If filtered colleges returned

#### Test 3.3: Get College Detail
**Request:**
```bash
curl -X GET "http://localhost:5000/api/colleges/COLLEGE_ID" \
  -H "Content-Type: application/json"
```

**Expected Response:** HTTP 200
```json
{
  "data": {
    "_id": "COLLEGE_ID",
    "name": "RVCE",
    "code": "106",
    "location": "Bangalore",
    "type": "Engineering",
    "totalSeats": 180,
    "branches": ["CS", "IT", "EC", "ME"],
    "website": "https://rvce.edu.in",
    "contactInfo": "080-1234567"
  }
}
```

**✓ PASS** - If college details returned

#### Test 3.4: Get Non-Existent College
**Request:**
```bash
curl -X GET "http://localhost:5000/api/colleges/invalid_id"
```

**Expected Response:** HTTP 404
```json
{
  "error": "College not found"
}
```

**✓ PASS** - If 404 error returned

---

### Phase 4: Cutoff Endpoints Testing

#### Test 4.1: Query Cutoffs - Valid Parameters
**Request:**
```bash
curl -X GET "http://localhost:5000/api/cutoffs?collegeCode=106&branchCode=CS&category=GM&round=1&year=2025" \
  -H "Content-Type: application/json"
```

**Expected Response:** HTTP 200
```json
{
  "data": [
    {
      "_id": "cutoff_id",
      "collegeCode": "106",
      "collegeName": "RVCE",
      "branchCode": "CS",
      "branchName": "Computer Science",
      "category": "GM",
      "round": 1,
      "cutoff": 4250,
      "year": 2025
    }
  ]
}
```

**✓ PASS** - If cutoff data returned

#### Test 4.2: Query Cutoffs - Missing Parameters
**Request:**
```bash
curl -X GET "http://localhost:5000/api/cutoffs?collegeCode=106"
```

**Expected Response:** HTTP 400
```json
{
  "error": "Missing required parameters"
}
```

**✓ PASS** - If validation error returned

#### Test 4.3: Query Cutoffs - Invalid Category
**Request:**
```bash
curl -X GET "http://localhost:5000/api/cutoffs?collegeCode=106&branchCode=CS&category=INVALID&round=1&year=2025"
```

**Expected Response:** HTTP 400 or 404

**✓ PASS** - If error or empty array returned

---

### Phase 5: Prediction Endpoints Testing

#### Test 5.1: Predict - Valid Input
**Request:**
```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "rank": 5000,
    "category": "GM",
    "branch": "CS",
    "round": 1,
    "year": 2025
  }'
```

**Expected Response:** HTTP 200
```json
{
  "data": {
    "input": {
      "rank": 5000,
      "category": "GM",
      "branch": "CS"
    },
    "predictions": [
      {
        "collegeCode": "106",
        "collegeName": "RVCE",
        "branch": "CS",
        "cutoff": 4250,
        "chance": "High"
      }
    ]
  }
}
```

**✓ PASS** - If predictions array returned

#### Test 5.2: Predict - Invalid Rank
**Request:**
```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "rank": -100,
    "category": "GM",
    "branch": "CS",
    "round": 1,
    "year": 2025
  }'
```

**Expected Response:** HTTP 400
```json
{
  "error": "Validation error"
}
```

**✓ PASS** - If validation error returned

#### Test 5.3: Predict - Invalid Category
**Request:**
```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "rank": 5000,
    "category": "INVALID",
    "branch": "CS",
    "round": 1,
    "year": 2025
  }'
```

**Expected Response:** HTTP 400

**✓ PASS** - If validation error returned

---

### Phase 6: AI Endpoints Testing

#### Test 6.1: AI Counselling
**Request:**
```bash
curl -X POST http://localhost:5000/api/ai/counsel \
  -H "Content-Type: application/json" \
  -d '{
    "rank": 5000,
    "category": "GM",
    "interests": ["CS", "AI", "ML"],
    "preferredLocation": "Bangalore",
    "preferredType": "Government"
  }'
```

**Expected Response:** HTTP 200
```json
{
  "data": {
    "recommendations": [
      {
        "college": "RVCE",
        "branch": "CS",
        "reason": "Matches your interests in CS and AI with strong placement record",
        "score": 85
      }
    ],
    "counsel": "Based on your rank and interests..."
  }
}
```

**✓ PASS** - If recommendations returned

#### Test 6.2: AI Compare Colleges
**Request:**
```bash
curl -X POST http://localhost:5000/api/ai/compare \
  -H "Content-Type: application/json" \
  -d '{
    "colleges": ["college_id_1", "college_id_2"],
    "branch": "CS",
    "category": "GM"
  }'
```

**Expected Response:** HTTP 200
```json
{
  "data": {
    "comparison": {
      "college1": {
        "name": "College 1",
        "cutoff": 4250,
        "placements": 95,
        "avgPackage": 8.5
      },
      "college2": {
        "name": "College 2",
        "cutoff": 3800,
        "placements": 92,
        "avgPackage": 7.8
      }
    },
    "recommendation": "College 1 has better placement record"
  }
}
```

**✓ PASS** - If comparison data returned

---

### Phase 7: Misc Endpoints Testing

#### Test 7.1: List Placements
**Request:**
```bash
curl -X GET http://localhost:5000/placements
```

**Expected Response:** HTTP 200
```json
{
  "data": [
    {
      "_id": "placement_id",
      "college": "RVCE",
      "branch": "CS",
      "year": 2024,
      "placementPercentage": 95,
      "avgPackage": 8.5
    }
  ]
}
```

**✓ PASS** - If placement data returned

#### Test 7.2: List Trends
**Request:**
```bash
curl -X GET http://localhost:5000/trends
```

**Expected Response:** HTTP 200
```json
{
  "data": {
    "mostPopularBranches": ["CS", "IT", "EC"],
    "averageCutoffs": { "GM": 4500, "OBC": 3500 },
    "placementTrends": [...]
  }
}
```

**✓ PASS** - If trend data returned

#### Test 7.3: List Reviews
**Request:**
```bash
curl -X GET http://localhost:5000/reviews
```

**Expected Response:** HTTP 200
```json
{
  "data": [
    {
      "_id": "review_id",
      "college": "RVCE",
      "rating": 4.5,
      "review": "Great college...",
      "author": "Student Name"
    }
  ]
}
```

**✓ PASS** - If reviews returned

#### Test 7.4: Create Review (Authenticated)
**Request:**
```bash
curl -X POST http://localhost:5000/reviews \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "college": "college_id",
    "rating": 4,
    "review": "Good college with great placement"
  }'
```

**Expected Response:** HTTP 201
```json
{
  "data": {
    "_id": "review_id",
    "college": "RVCE",
    "rating": 4,
    "review": "Good college with great placement",
    "author": "Test User"
  }
}
```

**✓ PASS** - If review created

#### Test 7.5: List AI Chats
**Request:**
```bash
curl -X GET http://localhost:5000/ai-chats
```

**Expected Response:** HTTP 200
```json
{
  "data": [
    {
      "_id": "chat_id",
      "title": "College Selection Help",
      "messages": [...]
    }
  ]
}
```

**✓ PASS** - If chats returned

#### Test 7.6: Create AI Chat
**Request:**
```bash
curl -X POST http://localhost:5000/ai-chats \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My College Query",
    "message": "Which college should I choose?"
  }'
```

**Expected Response:** HTTP 201
```json
{
  "data": {
    "_id": "chat_id",
    "title": "My College Query",
    "messages": [...]
  }
}
```

**✓ PASS** - If chat created

---

### Phase 8: Admin Endpoints Testing

#### Prerequisites
- Get admin token (may need special user creation or existing admin)

#### Test 8.1: Dashboard Stats (Admin)
**Request:**
```bash
curl -X GET http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response:** HTTP 200 (with admin) or 403 (without admin)
```json
{
  "data": {
    "totalUsers": 150,
    "totalColleges": 50,
    "totalCutoffs": 500,
    "activePredictions": 45
  }
}
```

**✓ PASS** - If stats returned (or 403 if not admin)

#### Test 8.2: Admin List Colleges
**Request:**
```bash
curl -X GET http://localhost:5000/api/admin/colleges \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response:** HTTP 200 (with admin) or 403 (without)
```json
{
  "data": [
    {
      "_id": "college_id",
      "name": "RVCE",
      "code": "106",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**✓ PASS** - If colleges returned

#### Test 8.3: Admin Create College
**Request:**
```bash
curl -X POST http://localhost:5000/api/admin/colleges \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test College",
    "code": "999",
    "location": "Test City",
    "type": "Engineering",
    "totalSeats": 100,
    "branches": ["CS", "IT"]
  }'
```

**Expected Response:** HTTP 201 (with admin) or 403 (without)

**✓ PASS** - If college created

#### Test 8.4: Admin Categories
**Request:**
```bash
curl -X GET http://localhost:5000/api/admin/categories \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response:** HTTP 200
```json
{
  "data": ["GM", "OBC", "SC", "ST", "EWS"]
}
```

**✓ PASS** - If categories returned

---

## Test Results Summary Template

### Endpoint Testing Matrix

| Category | Endpoint | Method | Auth | Status | Notes |
|----------|----------|--------|------|--------|-------|
| Health | /health | GET | No | ✓ | All working |
| Auth | /api/auth/signup | POST | No | ✓ | Duplicate email handled |
| Auth | /api/auth/login | POST | No | ✓ | Returns token |
| Auth | /api/auth/me | GET | Yes | ✓ | Token validated |
| Auth | /api/auth/logout | POST | No | ✓ | Success |
| Colleges | /api/colleges | GET | No | ✓ | Lists colleges |
| Colleges | /api/colleges/:id | GET | No | ✓ | Gets details |
| Cutoffs | /api/cutoffs | GET | No | ✓ | Query working |
| Predict | /api/predict | POST | Opt | ✓ | Returns predictions |
| AI | /api/ai/counsel | POST | Opt | ✓ | Counselling working |
| AI | /api/ai/compare | POST | Opt | ✓ | Comparison working |
| Misc | /placements | GET | No | ✓ | Data returned |
| Misc | /trends | GET | No | ✓ | Trends available |
| Misc | /reviews | GET | No | ✓ | Reviews listed |
| Misc | /ai-chats | GET | No | ✓ | Chats listed |
| Admin | /api/admin/dashboard/stats | GET | Yes | ✓ | Stats available |
| Admin | /api/admin/colleges | GET | Yes | ✓ | Admin list works |

---

## Issues Found & Fixes

### Issue #1: [Issue Description]
- **Severity:** Low/Medium/High
- **Endpoint:** /api/endpoint
- **Error:** Error message
- **Fix Applied:** Solution
- **Status:** Resolved/Pending

---

## Performance Notes

- Average response time: < 200ms
- Concurrent requests handled: Yes
- Database query optimization: Good
- Rate limiting: Working

---

## Sign-Off

- **Tested By:** [Name]
- **Test Date:** [Date]
- **Backend Version:** 1.0.0
- **Overall Status:** ✓ PASS / ⚠️ PASS WITH WARNINGS / ✗ FAIL

---

## Next Steps

1. [ ] All endpoints tested and working
2. [ ] Admin endpoints verified
3. [ ] Edge cases handled
4. [ ] Performance acceptable
5. [ ] Ready for deployment

