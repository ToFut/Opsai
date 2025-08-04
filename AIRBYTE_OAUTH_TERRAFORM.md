# Airbyte OAuth with Terraform Setup

## The Issue
Airbyte Cloud requires HTTPS URLs for OAuth redirects, but local development uses HTTP. This causes Airbyte OAuth to fail and fall back to direct OAuth.

## Solutions

### 1. Development Solution - Use ngrok
```bash
# Install ngrok
brew install ngrok

# Start your app
PORT=7250 npm run dev

# In another terminal, create HTTPS tunnel
ngrok http 7250

# You'll get an HTTPS URL like: https://abc123.ngrok.io
# Add to .env:
AIRBYTE_REDIRECT_URL=https://abc123.ngrok.io/api/oauth/callback
```

### 2. Production Solution - Terraform Configuration

Create a Terraform configuration for HTTPS endpoints:

```hcl
# terraform/oauth-proxy.tf
resource "aws_api_gateway_rest_api" "oauth_proxy" {
  name = "opsai-oauth-proxy"
}

resource "aws_api_gateway_deployment" "oauth_proxy" {
  rest_api_id = aws_api_gateway_rest_api.oauth_proxy.id
  stage_name  = "prod"
}

output "oauth_redirect_url" {
  value = "https://${aws_api_gateway_deployment.oauth_proxy.invoke_url}/api/oauth/callback"
}
```

### 3. Environment-Based Configuration

Update your `.env` files:

```bash
# .env.local (with ngrok)
AIRBYTE_REDIRECT_URL=https://your-ngrok-url.ngrok.io/api/oauth/callback

# .env.production (with Terraform)
AIRBYTE_REDIRECT_URL=https://api.yourapp.com/api/oauth/callback
```

### 4. Configure Airbyte OAuth Apps

In your Airbyte Cloud workspace:
1. Go to Settings → OAuth Applications
2. Update redirect URLs to use HTTPS
3. For each provider (GitHub, Google, etc.), add:
   - Development: `https://your-ngrok-url.ngrok.io/api/oauth/callback`
   - Production: `https://api.yourapp.com/api/oauth/callback`

## Why This Approach?

1. **Security**: Airbyte requires HTTPS for OAuth (industry standard)
2. **Flexibility**: Different URLs for dev/prod environments
3. **Terraform Integration**: Infrastructure as code for production
4. **Fallback**: Direct OAuth still works when Airbyte fails

## Quick Start

1. **For immediate local testing** (skip Airbyte, use direct OAuth):
   - Current setup works fine! Direct OAuth handles everything

2. **For Airbyte OAuth in development**:
   ```bash
   ngrok http 7250
   # Copy HTTPS URL to .env as AIRBYTE_REDIRECT_URL
   # Restart your app
   ```

3. **For production with Terraform**:
   - Deploy the API Gateway proxy
   - Update OAuth apps with production URLs
   - Set AIRBYTE_REDIRECT_URL in production environment

## Current Status
- ✅ Direct OAuth working perfectly
- ✅ COOP headers fixed for popup handling
- ✅ Environment-based redirect URLs configured
- ⏳ Airbyte OAuth requires HTTPS setup

The system is working correctly - it's using direct OAuth as a fallback when Airbyte's HTTPS requirement isn't met.