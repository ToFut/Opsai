# OAuth Configuration Guide

## The Problem
OAuth providers require exact redirect URI matches. Your app is using `http://localhost:7250/api/oauth/callback` but the OAuth apps are configured with different URIs.

## Required OAuth App Configurations

### 1. GitHub OAuth App
- Go to: https://github.com/settings/developers
- Find your OAuth App (Client ID: `Ov23lixYKPOibZXQhBWA`)
- Add to "Authorization callback URL":
  ```
  http://localhost:7250/api/oauth/callback
  ```

### 2. Google OAuth (Google Cloud Console)
- Go to: https://console.cloud.google.com/apis/credentials
- Find your OAuth 2.0 Client (Client ID: `450407158366-0980bfoo5p16rge9t771638j43rge9kj.apps.googleusercontent.com`)
- Add to "Authorized redirect URIs":
  ```
  http://localhost:7250/api/oauth/callback
  ```

### 3. Stripe Connect
- Go to: https://dashboard.stripe.com/settings/connect
- Add to "Redirect URIs":
  ```
  http://localhost:7250/api/oauth/callback
  ```

### 4. Shopify App
- Go to: https://partners.shopify.com/
- Find your app (Client ID: `bbc75b3f9cb4265e7632993f46e65494`)
- Add to "App URL" or "Redirect URLs":
  ```
  http://localhost:7250/api/oauth/callback
  ```

### 5. Calendly
- Go to: Calendly Developer Portal
- Find your app (Client ID: `_DmQyhGQL2dZ_K73usV9DSkz924K8X1maQAn_6azYXc`)
- Add redirect URI:
  ```
  http://localhost:7250/api/oauth/callback
  ```

## Alternative Solution: Use ngrok for HTTPS

Some OAuth providers (like Shopify) require HTTPS. You can use ngrok:

1. Install ngrok: `brew install ngrok`
2. Run: `ngrok http 7250`
3. Use the HTTPS URL (e.g., `https://abc123.ngrok.io`) in:
   - OAuth app configurations
   - `.env.local` as `NEXT_PUBLIC_APP_URL`

## Quick Fix for Development

For immediate testing, you can update the redirect URI to use a production URL and then manually redirect back to localhost. Update `.env.local`:

```
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

Then add a development override in the OAuth callback handler.

## Google Analytics Note

"google-analytics" is not a separate OAuth provider - it uses Google OAuth. When connecting to Google, request the Analytics scope:
- `https://www.googleapis.com/auth/analytics.readonly`

The error suggests you might be using "google-analytics" as a provider instead of "google".