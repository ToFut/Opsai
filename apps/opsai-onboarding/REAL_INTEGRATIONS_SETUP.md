# Real Airbyte Integrations Setup Guide

**🚨 IMPORTANT: This system now only supports real integrations. No demo/mock modes.**

## ✅ What Was Removed

- ❌ All demo/mock data generators
- ❌ Simulated OAuth flows 
- ❌ Mock connections and test data
- ❌ Fallback demo modes
- ❌ Local OAuth simulation page

## ✅ What You Get

- ✅ **Real Airbyte API integration only**
- ✅ **Actual provider OAuth flows**
- ✅ **Live data connections**
- ✅ **Production-ready architecture**

## 🔧 Required Setup

### 1. Airbyte Configuration (Required)

```bash
# .env.local
AIRBYTE_API_URL=https://api.airbyte.com/v1
AIRBYTE_API_KEY=your_real_airbyte_api_key
AIRBYTE_WORKSPACE_ID=your_real_workspace_id
```

**How to get these:**
1. Sign up at [Airbyte Cloud](https://cloud.airbyte.com/)
2. Go to Settings → Account → API Keys
3. Create new API key
4. Copy your Workspace ID from Settings → General

### 2. OpenAI Configuration (For AI Recommendations)

```bash
# .env.local
OPENAI_API_KEY=sk-your_real_openai_api_key
```

### 3. Supabase Configuration (For Data Storage)

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Provider OAuth Apps (Optional - For Direct OAuth)

```bash
# .env.local

# Google (for Google Analytics, Google Ads, etc.)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Shopify
SHOPIFY_CLIENT_ID=your_shopify_app_client_id
SHOPIFY_CLIENT_SECRET=your_shopify_app_client_secret

# Stripe
STRIPE_CLIENT_ID=your_stripe_connect_client_id
STRIPE_CLIENT_SECRET=your_stripe_connect_client_secret

# Salesforce
SALESFORCE_CLIENT_ID=your_salesforce_connected_app_id
SALESFORCE_CLIENT_SECRET=your_salesforce_connected_app_secret

# HubSpot
HUBSPOT_CLIENT_ID=your_hubspot_app_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_app_client_secret

# ... other providers
```

#### Google Analytics Setup (Detailed)

**Google Analytics requires additional setup:**

1. **Google Cloud Console Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing one
   - Enable "Google Analytics Reporting API"
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:7250/oauth-success` (dev) and your production URL

2. **OAuth Consent Screen**:
   - Configure OAuth consent screen
   - Add scopes: `https://www.googleapis.com/auth/analytics.readonly`
   - Add test users (for development)

3. **Environment Variables**:
   ```bash
   GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   ```

## 🚀 How It Works Now

### OAuth Flow (Real Only)
```
1. User clicks "Connect" → System checks Airbyte configuration
2. If configured → Creates real Airbyte OAuth consent URL
3. User redirects to actual provider (Shopify, Stripe, etc.)
4. Provider redirects back with real auth code
5. System exchanges code via Airbyte API
6. Real connection created in Airbyte workspace
7. Data sync begins automatically
```

### Error Handling
- **No Airbyte config** → Clear error message with setup instructions
- **Invalid provider** → Specific error about missing source definition
- **OAuth failure** → Real error from provider/Airbyte
- **No fallbacks** → System requires proper configuration

## 🧪 Testing Your Setup

### 1. Check Configuration
```bash
# Start the app
npm run dev

# Check console for configuration status
```

### 2. Test AI Recommendations
```bash
curl -X POST http://localhost:7250/api/airbyte/recommendations \
  -H "Content-Type: application/json" \
  -d '{"businessProfile": {"industry": "saas", "businessType": "b2b", "size": "medium"}}'
```

### 3. Test OAuth URL Creation
```bash
curl -X POST http://localhost:7250/api/oauth/create-url \
  -H "Content-Type: application/json" \
  -d '{"provider": "shopify", "tenantId": "test123", "redirectUri": "http://localhost:7250/oauth-success"}'
```

**Expected responses:**
- ✅ **With Airbyte config**: Real OAuth URL to provider
- ❌ **Without config**: Clear error message with setup instructions

## 🎯 Production Deployment Checklist

### Environment Variables
- [ ] `AIRBYTE_API_KEY` configured
- [ ] `AIRBYTE_WORKSPACE_ID` configured  
- [ ] `OPENAI_API_KEY` configured (for AI features)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] Provider OAuth apps configured (optional)

### Airbyte Workspace Setup
- [ ] Airbyte Cloud account created
- [ ] Workspace created and configured
- [ ] Required source connectors installed
- [ ] API access enabled
- [ ] OAuth redirect URIs configured

### Database Setup (Supabase)
- [ ] Supabase project created
- [ ] Required tables created:
  - `tenant_airbyte_connections`
  - `tenant_metadata`
- [ ] Row Level Security (RLS) enabled
- [ ] Service role configured

### Security
- [ ] All redirect URIs use HTTPS in production
- [ ] Environment variables secured
- [ ] API keys rotated regularly
- [ ] Database access restricted

## 🔍 Troubleshooting

### "Airbyte API not configured"
- Check `AIRBYTE_API_KEY` and `AIRBYTE_WORKSPACE_ID` in environment
- Verify API key has proper permissions
- Confirm workspace ID is correct

### "Source definition not found"
- Provider not supported in your Airbyte workspace
- Install required source connector in Airbyte dashboard
- Check source definition IDs in code match Airbyte

### "OAuth completion failed"
- Invalid OAuth app configuration
- Incorrect redirect URIs
- Provider-specific authentication issues
- Check Airbyte logs for detailed errors

### "Connection test failed"  
- Invalid credentials provided during OAuth
- Network connectivity issues
- Provider API limitations
- Check connection configuration in Airbyte

## 📊 Integration Status

| Provider | Status | OAuth Setup | Airbyte Support | Setup Required |
|----------|--------|-------------|-----------------|----------------|
| Shopify | ✅ Ready | Optional | Yes | AIRBYTE_API_KEY or SHOPIFY_CLIENT_ID |
| Stripe | ✅ Ready | Optional | Yes | AIRBYTE_API_KEY or STRIPE_CLIENT_ID |
| Salesforce | ✅ Ready | Optional | Yes | AIRBYTE_API_KEY or SALESFORCE_CLIENT_ID |
| Google Analytics | ⚠️ Setup Required | **Required** | Yes | GOOGLE_CLIENT_ID + Google Cloud Console |
| HubSpot | ✅ Ready | Optional | Yes | AIRBYTE_API_KEY or HUBSPOT_CLIENT_ID |
| Slack | ✅ Ready | Optional | Yes | AIRBYTE_API_KEY or SLACK_CLIENT_ID |
| PostgreSQL | ✅ Ready | No OAuth | Yes | AIRBYTE_API_KEY only |
| MySQL | ✅ Ready | No OAuth | Yes | AIRBYTE_API_KEY only |

## 🚨 Breaking Changes

If you were using the previous demo mode:

1. **System will fail without proper configuration**
2. **No fallback to mock data**
3. **All connections must be real**
4. **OAuth redirects to actual providers**
5. **Requires valid API keys and credentials**

This ensures data integrity and production readiness, but requires proper setup before use.

## 🆘 Support

- **Airbyte Issues**: [Airbyte Documentation](https://docs.airbyte.com/)
- **OAuth Setup**: Provider-specific OAuth documentation
- **Configuration**: Check environment variables and logs
- **Data Issues**: Verify Supabase database setup