# OAuth Provider Setup for Airbyte

This document explains how OAuth providers are configured in the Terraform setup for automatic data syncing to Supabase.

## How It Works

When a user connects their OAuth account through your application:

1. **User Authorization**: User clicks "Connect [Provider]" in your app
2. **OAuth Flow**: User is redirected to provider's OAuth consent page
3. **Token Reception**: Your app receives access/refresh tokens
4. **Terraform Update**: Update the terraform.tfvars with the user's credentials
5. **Apply Changes**: Run `terraform apply` to create the connection
6. **Automatic Sync**: Data starts syncing to Supabase on schedule

## Provider Status

### ✅ Working Providers

#### Stripe
- **Status**: Fully operational
- **Connection ID**: d1ecfa35-7c9e-4f28-94e6-fd6fc459b621
- **Sync Schedule**: Every 2 hours
- **Data Synced**: Charges, Customers, Invoices, Subscriptions
- **Required**: API Secret Key

### 🔧 Providers Ready (Need Definition IDs)

#### GitHub
- **Configuration**: Ready
- **Required**: Personal Access Token with repo access
- **Data to Sync**: Repositories, Issues, Pull Requests
- **Note**: Requires specific repository names (not wildcard)

#### Google Analytics
- **Configuration**: Ready  
- **Required**: OAuth refresh token, Property IDs
- **Data to Sync**: Website analytics data
- **Note**: Needs correct resource type in provider

#### Calendly
- **Configuration**: Ready
- **Required**: API Key
- **Data to Sync**: Events, Users
- **Note**: Definition ID needs verification

### ⚠️ Providers with Issues

#### Shopify
- **Status**: Source created but connection fails
- **Issue**: Connector error when creating connection
- **Required**: Shop domain and access token

## OAuth Flow Implementation

```javascript
// Example OAuth flow in your app
async function connectProvider(provider) {
  switch(provider) {
    case 'stripe':
      // Direct API key input
      const apiKey = await promptForApiKey();
      await updateTerraformVars({ stripe: { client_secret: apiKey } });
      break;
      
    case 'github':
      // OAuth flow
      const githubToken = await oauthFlow('github');
      await updateTerraformVars({ github: { client_secret: githubToken } });
      break;
      
    case 'google':
      // OAuth flow with refresh token
      const googleTokens = await oauthFlow('google', ['analytics.readonly']);
      await updateTerraformVars({ 
        google: { 
          client_secret: googleTokens.refresh_token,
          property_ids: await selectAnalyticsProperties()
        } 
      });
      break;
  }
  
  // Apply Terraform changes
  await exec('terraform apply -auto-approve');
}
```

## Terraform Variables Structure

Update `terraform.tfvars` with real credentials:

```hcl
oauth_providers = {
  stripe = {
    client_id     = "pk_live_..." # Publishable key (not used for source)
    client_secret = "sk_live_..." # Secret key (used for API access)
    enabled       = true
  }
  github = {
    client_id     = "Ov23li..." # OAuth App ID
    client_secret = "ghp_..." # Personal Access Token
    enabled       = true
  }
  google = {
    client_id     = "450407..." # OAuth Client ID
    client_secret = "refresh_token_here" # OAuth Refresh Token
    enabled       = true
  }
  calendly = {
    client_id     = "_DmQyh..." # OAuth Client ID  
    client_secret = "api_key_here" # API Key
    enabled       = true
  }
}
```

## Next Steps

1. **Find Correct Definition IDs**: 
   - Query Airbyte API for available source definitions
   - Update definition IDs in sources.tf

2. **Fix Resource Types**:
   - Some sources might need different resource types
   - Check provider documentation for correct names

3. **Test Each Provider**:
   - Create minimal configuration first
   - Add stream configurations after successful connection

4. **Production Setup**:
   - Store credentials securely (e.g., AWS Secrets Manager)
   - Use Terraform workspaces for multi-tenant setup
   - Implement proper error handling

## Troubleshooting

### Common Issues

1. **404 Definition Not Found**: Definition ID is incorrect
2. **422 Validation Error**: Configuration format is wrong
3. **500 Connector Error**: Source configuration issue
4. **401 Unauthorized**: OAuth token expired or invalid

### Debug Commands

```bash
# List current state
terraform state list

# Show specific resource
terraform state show airbyte_source_stripe.stripe_source[0]

# Force recreation
terraform taint airbyte_source_shopify.shopify_source[0]
terraform apply
```