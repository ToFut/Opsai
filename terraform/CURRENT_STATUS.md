# Airbyte Terraform Infrastructure Status

## Summary

The Terraform configuration is set up to automatically create Airbyte connections to Supabase when users connect their OAuth accounts. Currently, **Stripe → Supabase** is fully operational and syncing data every 2 hours.

## How the OAuth Flow Works

1. **User connects account** in your app (e.g., clicks "Connect Stripe")
2. **OAuth authentication** - user authorizes access
3. **Your app receives tokens** (access token, refresh token, API keys)
4. **Update terraform.tfvars** with the user's credentials
5. **Run `terraform apply`** to create the Airbyte connection
6. **Data automatically syncs** to Supabase on schedule

## Current Infrastructure

### ✅ Operational
- **Stripe → Supabase Pipeline**
  - Source ID: `95c2880d-903a-4e15-b9a4-af77e59a2484`
  - Connection ID: `d1ecfa35-7c9e-4f28-94e6-fd6fc459b621`
  - Syncing: charges, customers, invoices, subscriptions
  - Schedule: Every 2 hours

### 🟡 Created but Not Connected
- **Shopify Source** (ID: `73368a09-8c3e-467d-b30c-0617f2b50dd2`)
  - Issue: Connector error when creating connection

### 🔴 Ready to Deploy (Need Correct Definition IDs)
- **GitHub** - Needs correct definition ID
- **Google Analytics** - Needs correct resource type
- **Calendly** - Needs correct definition ID
- **Salesforce** - Ready when enabled
- **HubSpot** - Ready when enabled

## Quick Commands

```bash
# Check current state
terraform state list

# View outputs
terraform output

# Apply changes after updating credentials
terraform apply -auto-approve

# Destroy and recreate everything
terraform destroy -auto-approve
terraform apply -auto-approve
```

## To Enable a New Provider

1. Get user's OAuth credentials
2. Update `terraform.tfvars`:
   ```hcl
   oauth_providers = {
     provider_name = {
       client_id     = "from_oauth"
       client_secret = "access_token_or_api_key"
       enabled       = true  # Set to true
     }
   }
   ```
3. Run `terraform apply -auto-approve`

## Important Notes

- All data flows to your Supabase database
- Terraform uses OAuth2 client credentials for automatic token refresh
- Each provider needs specific credentials (API keys, tokens, etc.)
- Some providers need additional config (shop domain, property IDs, etc.)