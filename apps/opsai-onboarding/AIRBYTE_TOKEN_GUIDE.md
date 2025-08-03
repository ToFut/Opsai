# Airbyte Token Management Guide

## The Problem

Airbyte API tokens expire very quickly (15 minutes). This is why you see empty sources - your token has expired!

## The Solution

I've implemented automatic token refresh using OAuth 2.0 Client Credentials flow.

### Required Environment Variables

```bash
# OAuth Client Credentials (for auto-refresh)
AIRBYTE_CLIENT_ID=4af7a574-b155-47ee-8dce-2cd2c519a34a
AIRBYTE_CLIENT_SECRET=qxbgA1QsHSZBfOVqdgjbiNJ1ultXGwz7
AIRBYTE_WORKSPACE_ID=293ab9ea-b538-4a5d-940d-7eacaffda8f5

# Static token (optional, will be auto-refreshed)
AIRBYTE_API_KEY=your-token-here
```

## How It Works

1. **Automatic Token Refresh**:
   - When you make an API call, the system checks if the token is valid
   - If expired, it automatically gets a new token using client credentials
   - The new token is cached for 15 minutes
   - No manual intervention needed!

2. **Token Manager**:
   - Located in `/lib/airbyte-token-manager.ts`
   - Handles all token lifecycle management
   - Caches tokens to minimize API calls
   - Automatically retries on 401 errors

3. **Fallback Mechanism**:
   - If OAuth refresh fails, falls back to static token
   - If no credentials available, shows mock data

## Testing Token Refresh

1. **Check Token Status**:
   ```
   http://localhost:7250/api/airbyte/refresh-token
   ```

2. **Test Auto-Refresh**:
   ```
   http://localhost:7250/airbyte-setup
   ```
   - Should now load real sources automatically
   - Token will refresh in the background

## Why Tokens Expire So Fast

Airbyte uses short-lived JWT tokens for security:
- **Duration**: 15 minutes (900 seconds)
- **Security**: Limits exposure if token is compromised
- **Best Practice**: Use client credentials for programmatic access

## Manual Token Refresh (Not Needed Anymore)

If you want to manually get a new token:

```bash
curl -X POST https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

## Troubleshooting

1. **Still seeing empty sources?**
   - Check server console for errors
   - Verify client credentials are correct
   - Restart the server after updating .env.local

2. **Token refresh failing?**
   - Make sure AIRBYTE_CLIENT_ID and AIRBYTE_CLIENT_SECRET are correct
   - These come from Airbyte Cloud → Settings → Applications

3. **Getting 401 errors?**
   - The system will auto-retry with a fresh token
   - Check if workspace ID matches your client credentials

## Benefits of Auto-Refresh

1. **No Manual Updates**: Never update AIRBYTE_API_KEY again
2. **Always Fresh**: Tokens refresh automatically
3. **Error Recovery**: Automatic retry on auth failures
4. **Performance**: Tokens are cached for optimal performance

## Next Steps

1. Make sure your `.env.local` has the client credentials
2. Restart your dev server
3. Visit `http://localhost:7250/airbyte-setup`
4. Sources should load automatically!

The system now handles all token management automatically. You'll never have to worry about expired tokens again!