#!/bin/bash

echo "============================================"
echo "  KCET ValidatorAI - End-to-End Test"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
  local name="$1"
  local url="$2"
  local method="${3:-GET}"
  local data="${4:-}"
  
  echo -n "Testing $name... "
  
  if [ "$method" = "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data")
  else
    response=$(curl -s -w "\n%{http_code}" "$url")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
    echo "  Response: $body"
    FAILED=$((FAILED + 1))
  fi
}

echo "Backend API Tests"
echo "--------------------------------------------"

# Health check
test_endpoint "Health Check" "http://localhost:5000/health"

# Colleges
test_endpoint "Colleges List" "http://localhost:5000/api/colleges"

# Categories
test_endpoint "Categories" "http://localhost:5000/api/categories"

# Cutoffs
test_endpoint "Cutoffs Query" "http://localhost:5000/api/cutoffs?collegeCode=106&branchCode=CS&category=GM&round=1&year=2025"

# Predictions
test_endpoint "Predictions" "http://localhost:5000/api/predictions" "POST" '{"rank":5000,"category":"GM","branch":"CS","round":1,"year":2025}'

# Admin Stats
test_endpoint "Admin Stats" "http://localhost:5000/api/admin/stats"

echo ""
echo "Frontend Tests"
echo "--------------------------------------------"

# Frontend homepage
test_endpoint "Frontend Homepage" "http://localhost:3000"

echo ""
echo "============================================"
echo "  Test Results"
echo "============================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed! ✓${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. ✗${NC}"
  exit 1
fi