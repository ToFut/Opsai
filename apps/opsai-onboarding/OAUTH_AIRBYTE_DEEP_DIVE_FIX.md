# OAuth & Airbyte Deep Dive Fix

## Issues Identified

### 1. OAuth Completion Detection Failure
**Problem**: OAuth completes but frontend doesn't detect it
**Root Cause**: 
- Message passing between popup and parent window not working reliably
- Provider name mismatch in callback

**Fixed By**:
- Added localStorage fallback detection
- Improved message event handling with logging
- Added provider name validation

### 2. Airbyte 401 Unauthorized
**Problem**: Airbyte API returns 401 despite valid API key
**Root Cause**:
- JWT token may be expired (check the `exp` claim)
- API endpoint might need different format

**Current Token Analysis**:
```
Token expires at: 1754312684 (Unix timestamp)
Current time: ~1754311784
Token is valid for ~15 minutes from creation
```

**Action Required**:
1. Get a fresh Airbyte API token from https://cloud.airbyte.com
2. Update AIRBYTE_API_KEY in .env.local

### 3. Missing OAuth Redirect URIs
**Problem**: OAuth providers reject redirect URIs
**Solution**: Add these to each OAuth app:
- `http://localhost:7250/api/oauth/callback`
- `https://yourapp.vercel.app/api/oauth/callback`

## Quick Fixes Applied

### 1. Enhanced OAuth Detection
```typescript
// Added multiple detection methods:
- window.postMessage
- localStorage fallback
- Popup close monitoring
- Proper timeout handling
```

### 2. Provider Mapping
```typescript
// Fixed provider name consistency:
'google-analytics' → 'google-analytics' (separate)
'stripe-connect' → 'stripe'
'google-workspace' → 'google'
```

### 3. Error Handling
- Better error messages
- Detailed console logging
- Graceful fallbacks

## Testing Steps

### 1. Test OAuth Flow
```bash
# 1. Open browser console
# 2. Go to http://localhost:7250/onboarding-v3
# 3. Try connecting each service
# 4. Watch console for detailed logs
```

### 2. Check Airbyte Token
```bash
# Decode JWT to check expiration
echo "YOUR_AIRBYTE_TOKEN" | cut -d. -f2 | base64 -d | jq .exp
```

### 3. Manual Airbyte Test
```bash
curl -X GET https://api.airbyte.com/v1/workspaces \
  -H "Authorization: Bearer YOUR_AIRBYTE_TOKEN" \
  -H "Accept: application/json"
```

## Environment Variables Required

```env
# OAuth Apps (in each provider's settings)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
STRIPE_CLIENT_ID=xxx
STRIPE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
SHOPIFY_CLIENT_ID=xxx
SHOPIFY_CLIENT_SECRET=xxx

# Airbyte (get fresh token from cloud.airbyte.com)
AIRBYTE_API_URL=https://api.airbyte.com/v1
AIRBYTE_API_KEY=xxx # Must be valid JWT
AIRBYTE_WORKSPACE_ID=xxx
```

## OAuth App Configuration

### Google OAuth
1. Go to https://console.cloud.google.com
2. APIs & Services → Credentials
3. Add redirect URI: `http://localhost:7250/api/oauth/callback`

### Stripe Connect
1. Go to https://dashboard.stripe.com/settings/connect
2. Add redirect URI: `http://localhost:7250/api/oauth/callback`

### GitHub OAuth
1. Go to https://github.com/settings/developers
2. Edit your OAuth App
3. Add callback URL: `http://localhost:7250/api/oauth/callback`

### Shopify App
1. Go to https://partners.shopify.com
2. Edit your app
3. Add redirect URL: `http://localhost:7250/api/oauth/callback`

## Debugging Commands

```bash
# Check if OAuth callback is receiving data
tail -f server.log | grep "OAuth callback"

# Test Airbyte connection
curl -X GET https://api.airbyte.com/v1/sources \
  -H "Authorization: Bearer $AIRBYTE_API_KEY" \
  -H "Accept: application/json"

# Check environment variables
env | grep -E "CLIENT_ID|CLIENT_SECRET|AIRBYTE"
```

## Next Steps

1. **Get Fresh Airbyte Token**
   - Log into https://cloud.airbyte.com
   - Go to Settings → API Keys
   - Generate new token
   - Update .env.local

2. **Verify OAuth Apps**
   - Check each OAuth app has correct redirect URIs
   - Ensure apps are not in test/sandbox mode
   - Verify client ID/secret match

3. **Test Each Integration**
   - Start with GitHub (simplest)
   - Then Google (basic profile only)
   - Then Stripe/Shopify

## Alternative: Skip Airbyte

If Airbyte continues to fail, implement direct API connections:
```typescript
// Instead of Airbyte, use direct APIs:
- Stripe: Use Stripe SDK
- Google Analytics: Use GA Data API
- GitHub: Use Octokit
- Shopify: Use Shopify SDK
```