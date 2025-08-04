# Fixed Sources Configuration for Airbyte Terraform Provider
# Using correct resource types and configuration structure

# GitHub Source
resource "airbyte_source_github" "github_source" {
  count = var.oauth_providers.github.enabled ? 1 : 0
  
  # definition_id auto-computed by provider
  name          = "${var.project_name}-github-${var.environment}"
  workspace_id  = var.airbyte_workspace_id
  
  configuration = {
    credentials = {
      personal_access_token = {
        option_title = "PAT Credentials"
        personal_access_token = var.oauth_providers.github.client_secret
      }
    }
    repositories = var.github_repositories  # From user's OAuth selection
    start_date   = "2023-01-01T00:00:00Z"
  }
}

# Salesforce Source
resource "airbyte_source_salesforce" "salesforce_source" {
  count = var.oauth_providers.salesforce.enabled ? 1 : 0
  
  definition_id = "b117307c-14b6-41aa-9422-947e34922962"
  name          = "${var.project_name}-salesforce-${var.environment}"
  workspace_id  = var.airbyte_workspace_id
  
  configuration = {
    client_id     = var.oauth_providers.salesforce.client_id
    client_secret = var.oauth_providers.salesforce.client_secret
    refresh_token = "your-salesforce-refresh-token"
    is_sandbox    = false
    start_date    = "2023-01-01T00:00:00Z"
  }
}

# Shopify Source
resource "airbyte_source_shopify" "shopify_source" {
  count = var.oauth_providers.shopify.enabled ? 1 : 0
  
  definition_id = "9da77001-af33-4bcd-be46-6252bf9342b9"
  name          = "${var.project_name}-shopify-${var.environment}"
  workspace_id  = var.airbyte_workspace_id
  
  configuration = {
    shop         = var.shopify_shop_domain  # From user's OAuth
    access_token = var.oauth_providers.shopify.client_secret
    start_date   = "2023-01-01"
  }
}

# HubSpot Source
resource "airbyte_source_hubspot" "hubspot_source" {
  count = var.oauth_providers.hubspot.enabled ? 1 : 0
  
  definition_id = "36c891d9-4bd9-43ac-bad2-10e12756272c"
  name          = "${var.project_name}-hubspot-${var.environment}"
  workspace_id  = var.airbyte_workspace_id
  
  configuration = {
    credentials = {
      credentials_title = "OAuth Credentials"
      client_id         = var.oauth_providers.hubspot.client_id
      client_secret     = var.oauth_providers.hubspot.client_secret
      refresh_token     = "your-hubspot-refresh-token"
    }
    start_date = "2023-01-01T00:00:00Z"
  }
}

# Stripe Source
resource "airbyte_source_stripe" "stripe_source" {
  count = var.oauth_providers.stripe.enabled ? 1 : 0
  
  definition_id = "e094cb9a-26de-4645-8761-65c0c425d1de"
  name          = "${var.project_name}-stripe-${var.environment}"
  workspace_id  = var.airbyte_workspace_id
  
  configuration = {
    client_secret = var.oauth_providers.stripe.client_secret
    account_id    = "your-stripe-account-id"
    start_date    = "2023-01-01T00:00:00Z"
  }
}

# Slack Source - TEMPORARILY DISABLED due to provider schema issues
# resource "airbyte_source_slack" "slack_source" {
#   count = var.oauth_providers.slack.enabled ? 1 : 0
#   
#   definition_id = "c2281cee-86f9-4a86-bb48-d23286b4c7bd"
#   name          = "${var.project_name}-slack-${var.environment}"
#   workspace_id  = var.airbyte_workspace_id
#   
#   configuration = {
#     credentials = {
#       option_title = "API Token Credentials"
#       api_token    = var.oauth_providers.slack.client_secret
#     }
#     start_date      = "2023-01-01T00:00:00Z"
#     lookback_window = 1
#     join_channels   = true
#   }
# }

# QuickBooks Source - TEMPORARILY DISABLED due to provider schema issues
# resource "airbyte_source_quickbooks" "quickbooks_source" {
#   count = var.oauth_providers.quickbooks.enabled ? 1 : 0
#   
#   definition_id = "6fd2e9bc-6d3c-4d9a-9c5d-1e2f3a4b5c6d"
#   name          = "${var.project_name}-quickbooks-${var.environment}"
#   workspace_id  = var.airbyte_workspace_id
#   
#   configuration = {
#     credentials = {
#       auth_type         = "OAuth2.0"
#       client_id         = var.oauth_providers.quickbooks.client_id
#       client_secret     = var.oauth_providers.quickbooks.client_secret
#       refresh_token     = "your-quickbooks-refresh-token"
#       access_token      = "your-quickbooks-access-token"
#       token_expiry_date = "2024-12-31T23:59:59.000Z"
#       realm_id          = "your-quickbooks-realm-id"
#     }
#     sandbox    = false
#     start_date = "2023-01-01"
#   }
# }

# Square Source
resource "airbyte_source_square" "square_source" {
  count = var.oauth_providers.square.enabled ? 1 : 0
  
  definition_id = "9bb7e7e2-1e1e-4e6a-8b0a-3b1e6b7c8d9e"
  name          = "${var.project_name}-square-${var.environment}"
  workspace_id  = var.airbyte_workspace_id
  
  configuration = {
    credentials = {
      auth_type     = "OAuth"
      client_id     = var.oauth_providers.square.client_id
      client_secret = var.oauth_providers.square.client_secret
      refresh_token = "your-square-refresh-token"
    }
    is_sandbox = false
    start_date = "2023-01-01"
  }
}

# Xero Source - REMOVED: Not supported by current Airbyte Terraform provider
# Use airbyte_source_file or airbyte_source_http instead for custom integrations

# Mailchimp Source
resource "airbyte_source_mailchimp" "mailchimp_source" {
  count = var.oauth_providers.mailchimp.enabled ? 1 : 0
  
  definition_id = "b03a9f3e-22a5-11eb-adc1-0242ac120002"
  name          = "${var.project_name}-mailchimp-${var.environment}"
  workspace_id  = var.airbyte_workspace_id
  
  configuration = {
    credentials = {
      auth_type     = "oauth2.0"
      client_id     = var.oauth_providers.mailchimp.client_id
      client_secret = var.oauth_providers.mailchimp.client_secret
      access_token  = "your-mailchimp-access-token"
    }
  }
}

# Zendesk Support Source
resource "airbyte_source_zendesk_support" "zendesk_source" {
  count = var.oauth_providers.zendesk.enabled ? 1 : 0
  
  definition_id = "79c1aa37-dae3-42ae-b333-d1c105477715"
  name          = "${var.project_name}-zendesk-${var.environment}"
  workspace_id  = var.airbyte_workspace_id
  
  configuration = {
    subdomain = "your-zendesk-subdomain"
    credentials = {
      credentials   = "oauth2.0"
      client_id     = var.oauth_providers.zendesk.client_id
      client_secret = var.oauth_providers.zendesk.client_secret
      access_token  = "your-zendesk-access-token"
    }
    start_date = "2023-01-01T00:00:00Z"
  }
}

# Calendly Source - DISABLED: Not supported by provider
# resource "airbyte_source_calendly" "calendly_source" {
#   count = var.oauth_providers.calendly.enabled ? 1 : 0
#   
#   # definition_id auto-computed by provider
#   name          = "${var.project_name}-calendly-${var.environment}"
#   workspace_id  = var.airbyte_workspace_id
#   
#   configuration = {
#     api_key    = var.oauth_providers.calendly.client_secret
#     start_date = "2023-01-01T00:00:00Z"
#   }
# }

# Google Analytics Data API Source
resource "airbyte_source_google_analytics_data_api" "google_analytics_source" {
  count = var.oauth_providers.google.enabled ? 1 : 0
  
  # definition_id auto-computed by provider
  name          = "${var.project_name}-google-analytics-${var.environment}"
  workspace_id  = var.airbyte_workspace_id
  
  configuration = {
    credentials = {
      auth_type     = "Client"
      client_id     = var.oauth_providers.google.client_id
      client_secret = var.oauth_providers.google.client_secret
      refresh_token = var.google_refresh_token != "" ? var.google_refresh_token : "your-google-refresh-token"
    }
    property_ids = var.google_analytics_properties  # From user's OAuth selection
    date_ranges_start_date = "2023-01-01"
  }
}