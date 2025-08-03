# Airbyte Integration Setup

## Current Status

Your Airbyte integration is now set up with the following:

### 1. API Endpoints

- **Simple Connect**: `/api/airbyte/simple-connect` - Main endpoint for creating connections
- **OAuth Complete**: `/api/airbyte/oauth-complete` - Handles OAuth callback from providers
- **Test Page**: `/test-airbyte` - UI for testing connections

### 2. OAuth Flow

1. User selects a provider (e.g., GitHub)
2. System calls `/api/airbyte/simple-connect`
3. For OAuth providers:
   - Returns an authorization URL
   - User is redirected to provider's OAuth page
   - After authorization, redirected back to `/oauth-success`
   - OAuth success page calls `/api/airbyte/oauth-complete`
   - Source is created in Airbyte with OAuth credentials

### 3. Special GitHub Handling

Due to Airbyte API issues, GitHub uses a direct token exchange:
- Exchanges OAuth code directly with GitHub
- Creates source using Personal Access Token (PAT) configuration
- Bypasses Airbyte's OAuth completion endpoint

### 4. Environment Variables

Your `.env.local` has all required credentials:
```
AIRBYTE_API_URL=https://api.airbyte.com/v1
AIRBYTE_API_KEY=eyJhbGci... (valid)
AIRBYTE_WORKSPACE_ID=293ab9ea-b538-4a5d-940d-7eacaffda8f5
GITHUB_CLIENT_ID=Ov23lixYKPOibZXQhBWA
GITHUB_CLIENT_SECRET=8b6c7f633224ba5321610930b18f820215e79314
```

### 5. How to Test

1. Start your app: `npm run dev`
2. Visit: `http://localhost:6060/test-airbyte`
3. Select "GitHub" from the dropdown
4. Click "Test Connection"
5. Authorize the GitHub OAuth App
6. Check if source is created in Airbyte

### 6. Supported Providers

- **GitHub** ✅ (with direct token exchange)
- **PostgreSQL** ✅ (direct connection)
- **MySQL** ✅ (direct connection)
- **Shopify** (OAuth)
- **Stripe** (OAuth)
- **Google Sheets** (OAuth - needs Google credentials)

### 7. Next Steps

1. Add more OAuth providers by adding their credentials to `.env.local`
2. Test the connection flow end-to-end
3. Integrate with the main onboarding flow

### 8. Troubleshooting

- If you see "Unauthorized", check if Airbyte API token is still valid
- GitHub OAuth requires the redirect URI to match exactly
- Check browser console for detailed error messages
- Visit `/api/debug/oauth-status` for configuration status