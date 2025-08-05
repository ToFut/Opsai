#!/bin/bash

# Enhanced Onboarding V3 - End-to-End Test
echo "🚀 Testing Enhanced Onboarding V3 Components"
echo "=========================================="

BASE_URL="http://localhost:7250"
TEST_WEBSITE="https://www.shopify.com"

# Test 1: AI Website Analysis
echo -e "\n🧪 Test 1: AI Website Analysis"
echo "--------------------------------"
echo "Testing: POST /api/ai-analyze"
AI_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai-analyze" \
  -H "Content-Type: application/json" \
  -d "{\"websiteUrl\": \"$TEST_WEBSITE\"}" \
  2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$AI_RESPONSE" ]; then
  echo "✅ AI Analysis working!"
  echo "$AI_RESPONSE" | jq -r '.businessIntelligence.industryCategory // "No category"' 2>/dev/null | head -1
else
  echo "❌ AI Analysis failed or returned empty response"
fi

# Test 2: OAuth Flow
echo -e "\n🧪 Test 2: OAuth Flow (GitHub)"
echo "--------------------------------"
echo "Testing: POST /api/oauth/connect"
OAUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/oauth/connect" \
  -H "Content-Type: application/json" \
  -d '{"provider": "github", "tenantId": "test-tenant"}' \
  2>/dev/null)

if [ $? -eq 0 ] && echo "$OAUTH_RESPONSE" | grep -q "authUrl"; then
  echo "✅ OAuth URL generation working!"
  echo "$OAUTH_RESPONSE" | jq -r '.authUrl' 2>/dev/null | head -50
else
  echo "❌ OAuth flow failed"
  echo "$OAUTH_RESPONSE" | head -100
fi

# Test 3: Check Airbyte Configuration
echo -e "\n🧪 Test 3: Airbyte Configuration"
echo "--------------------------------"
if [ ! -z "$AIRBYTE_CLIENT_ID" ]; then
  echo "✅ Airbyte configured"
  echo "  - Workspace: $AIRBYTE_WORKSPACE_ID"
else
  echo "⚠️  Airbyte not configured"
fi

# Test 4: App Generation
echo -e "\n🧪 Test 4: App Generation"
echo "--------------------------------"
echo "Testing: POST /api/generate-production-app"
APP_GEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/generate-production-app" \
  -H "Content-Type: application/json" \
  -H "X-Demo-Mode: true" \
  -d '{
    "tenantId": "test",
    "analysisId": "test",
    "appName": "Test App",
    "businessProfile": {"businessType": "E-commerce"},
    "dataArchitecture": {"models": []},
    "integrations": [],
    "deploymentConfig": {"platform": "vercel", "environment": "production"}
  }' \
  2>/dev/null | head -500)

if [ $? -eq 0 ] && echo "$APP_GEN_RESPONSE" | grep -q "applicationPath\|error"; then
  if echo "$APP_GEN_RESPONSE" | grep -q "applicationPath"; then
    echo "✅ App generation endpoint working!"
  else
    echo "❌ App generation failed:"
    echo "$APP_GEN_RESPONSE" | jq -r '.error // .details' 2>/dev/null | head -3
  fi
else
  echo "❌ App generation endpoint not responding"
fi

# Test 5: UI Endpoint
echo -e "\n🧪 Test 5: UI Endpoint"
echo "--------------------------------"
UI_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/onboarding-v3")
if [ "$UI_RESPONSE" = "200" ]; then
  echo "✅ Onboarding V3 UI accessible at: $BASE_URL/onboarding-v3"
else
  echo "❌ Onboarding V3 UI not accessible (HTTP $UI_RESPONSE)"
fi

echo -e "\n📊 Environment Status"
echo "====================="
[ ! -z "$OPENAI_API_KEY" ] && echo "✅ OpenAI API configured" || echo "❌ OpenAI API missing"
[ ! -z "$SUPABASE_MANAGEMENT_API_KEY" ] && echo "✅ Supabase Management configured" || echo "⚠️  Supabase Management not configured"
[ ! -z "$VERCEL_TOKEN" ] && echo "✅ Vercel configured" || echo "⚠️  Vercel not configured"
[ ! -z "$GITHUB_CLIENT_ID" ] && echo "✅ GitHub OAuth configured" || echo "❌ GitHub OAuth missing"

echo -e "\n🌐 To test the full UI flow:"
echo "============================"
echo "1. Open: $BASE_URL/onboarding-v3"
echo "2. Enter website: $TEST_WEBSITE"
echo "3. Complete all steps"
echo ""
echo "The system will use real services where configured."