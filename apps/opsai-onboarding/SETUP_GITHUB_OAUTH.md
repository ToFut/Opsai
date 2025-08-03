# Setting Up GitHub OAuth

You currently have a GitHub Personal Access Token (`GITHUB_API_KEY`), but for OAuth flow you need different credentials.

## Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in:
   - **Application name**: OpsAI Platform
   - **Homepage URL**: http://localhost:7250
   - **Authorization callback URL**: http://localhost:7250/oauth-success
   - **Enable Device Flow**: No (unchecked)

4. Click "Register application"

5. You'll get:
   - **Client ID**: Something like `Ov23liExample1234567890`
   - **Client Secret**: Click "Generate a new client secret"

## Add to .env.local

```bash
# GitHub OAuth (different from API key!)
GITHUB_CLIENT_ID=Ov23liExample1234567890
GITHUB_CLIENT_SECRET=your_generated_client_secret_here
```

## Current Status

- ✅ You have: `GITHUB_API_KEY` (for direct API access)
- ❌ You need: `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (for OAuth flow)

## Quick Test

After adding the OAuth credentials and restarting the server:

```bash
# Restart to load new env vars
pkill -f "next dev" && npm run dev
```

Then visit: http://localhost:7250/test-integrations

Click "Connect" on GitHub and it should redirect you to GitHub's OAuth page!

## Note

The `GITHUB_API_KEY` you have is useful for direct API access but OAuth requires a registered OAuth App with client ID/secret for the authorization flow.