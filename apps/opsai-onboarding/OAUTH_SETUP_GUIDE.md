# OAuth Integration Setup Guide

This guide explains how to set up OAuth integrations with Airbyte and various providers.

## 🚀 Quick Demo Mode

The application works out-of-the-box in demo mode without any configuration:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the OAuth flow:**
   - Visit `/test-integrations` or `/debug-cards`
   - Click any "Connect" button
   - You'll see a simulated OAuth flow that demonstrates the integration process

## 🔧 Production Setup with Airbyte

For real integrations, you need to configure Airbyte:

### 1. Get Airbyte API Credentials

1. Sign up for [Airbyte Cloud](https://cloud.airbyte.com/) or set up [Airbyte Open Source](https://airbyte.io/)
2. Go to Settings → Account → API Keys
3. Create a new API key
4. Note your Workspace ID from the URL or Settings

### 2. Configure Environment Variables

Create `.env.local` with:

```bash
AIRBYTE_API_URL=https://api.airbyte.com/v1
AIRBYTE_API_KEY=your_actual_airbyte_api_key
AIRBYTE_WORKSPACE_ID=your_actual_workspace_id
```

### 3. Provider-Specific Setup

For each provider you want to support, you'll need to configure OAuth apps:

#### Shopify
1. Create a Shopify Partner account
2. Create a new app in your partner dashboard
3. Configure OAuth redirect URI: `https://your-domain.com/oauth-success`
4. Add to `.env.local`:
   ```bash
   SHOPIFY_CLIENT_ID=your_shopify_client_id
   SHOPIFY_CLIENT_SECRET=your_shopify_client_secret
   ```

#### Stripe
1. Go to Stripe Dashboard → Settings → Connect
2. Create a Connect application
3. Set redirect URI: `https://your-domain.com/oauth-success`
4. Add to `.env.local`:
   ```bash
   STRIPE_CLIENT_ID=your_stripe_client_id
   STRIPE_CLIENT_SECRET=your_stripe_client_secret
   ```

## 🎭 How the Demo Mode Works

When no real OAuth credentials are configured, the system:

1. **Creates a demo OAuth URL** (`/oauth-demo`) instead of redirecting to real providers
2. **Simulates the OAuth flow** with a realistic authorization page
3. **Generates demo authorization codes** and processes them like real OAuth
4. **Stores demo connections** in localStorage for development

## 🔄 OAuth Flow Architecture

### With Airbyte (Production)
```
1. User clicks "Connect" → 
2. System calls Airbyte OAuth consent URL API → 
3. User redirects to real provider OAuth → 
4. Provider redirects back with auth code → 
5. System exchanges code via Airbyte API → 
6. Connection established in Airbyte
```

### Demo Mode (Development)
```
1. User clicks "Connect" → 
2. System redirects to local /oauth-demo page → 
3. User authorizes in simulated flow → 
4. Demo page generates fake auth code → 
5. System processes demo code → 
6. Demo connection stored locally
```

## 🧪 Testing the Integration

### Option 1: Debug Cards Page
Visit `/debug-cards` to test individual OAuth connections with detailed logging.

### Option 2: Test Integrations Page  
Visit `/test-integrations` to test the full AirbyteIntegrationHub component.

### Option 3: Full Onboarding Flow
Visit `/onboarding?step=connect-data` to test the complete onboarding experience.

## 🔍 Troubleshooting

### Common Issues

1. **"No application matches the supplied client identifier"**
   - This happens when using demo client IDs with real OAuth URLs
   - The system now uses demo mode by default to avoid this error

2. **Airbyte API errors**
   - Check your API key and workspace ID
   - Ensure your Airbyte workspace has the required source connectors enabled

3. **OAuth redirect errors**
   - Verify your redirect URIs match exactly in your OAuth app settings
   - Ensure your domain is properly configured (use `https` in production)

### Debug Logging

The application provides extensive console logging:
- `🤖` AI recommendations
- `🔗` OAuth URL creation
- `🚀` Airbyte API calls
- `✅` Successful operations
- `❌` Errors and failures

## 🌟 AI Recommendations

The system includes intelligent integration recommendations based on:

- **Business profile** (industry, size, business type)
- **Use case analysis** with expected ROI
- **Priority scoring** (critical, high, medium, low)
- **Fallback logic** when AI is unavailable

## 📈 Production Deployment

For production deployment:

1. Set up proper OAuth apps with real client credentials
2. Configure Airbyte Cloud or self-hosted instance
3. Use HTTPS for all redirect URIs
4. Set up proper error monitoring and logging
5. Consider implementing rate limiting for OAuth endpoints

## 🔐 Security Notes

- Never commit real OAuth credentials to version control
- Use environment variables for all sensitive configuration
- Implement proper state validation in OAuth flows
- Use HTTPS in production for all OAuth redirects
- Consider implementing PKCE for additional security