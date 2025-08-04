# OAuth Setup Guide

## Issues Fixed
- ✅ Development server is now running on port 7250
- ✅ API endpoints are properly configured  
- ✅ Environment variables are set for correct port
- ✅ Airbyte OAuth fallback to direct OAuth is working

## Current Status
The OAuth connection error (`net::ERR_CONNECTION_REFUSED`) has been resolved. The server is now running properly on port 7250.

## Required OAuth App Setup

To complete the OAuth integration, you need to create OAuth applications for each provider:

### 1. Google OAuth (for Google Analytics)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Analytics Reporting API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Set redirect URI: `http://localhost:7250/api/oauth/callback`
6. Update `.env`:
   ```
   GOOGLE_CLIENT_ID=your-actual-google-client-id
   GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
   ```

### 2. GitHub OAuth (for GitHub integration)
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set redirect URI: `http://localhost:7250/api/oauth/callback`
4. Update `.env`:
   ```
   GITHUB_CLIENT_ID=your-actual-github-client-id
   GITHUB_CLIENT_SECRET=your-actual-github-client-secret
   ```

## Testing the OAuth Flow

1. Navigate to: `http://localhost:7250/onboarding-v3?url=tovfurniture.com`
2. Try connecting Google Analytics - it should now work without connection errors
3. The system will attempt Airbyte OAuth first, then fall back to direct OAuth

## Current OAuth Flow
1. **Airbyte OAuth** (primary) - Uses your configured Airbyte workspace
2. **Direct OAuth** (fallback) - Uses provider-specific OAuth apps when Airbyte fails
3. **Error Handling** - Graceful fallback with user feedback

The connection refused error should now be resolved!