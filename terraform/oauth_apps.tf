# OAuth Application Configuration
# This file documents OAuth app settings and can manage some providers via Terraform

locals {
  # Define redirect URIs for different environments
  oauth_redirect_uris = {
    dev = [
      "http://localhost:7250/api/oauth/callback",
      "http://localhost:3000/api/oauth/callback",
      "http://localhost:3003/api/oauth/callback"
    ]
    staging = [
      "https://staging.opsai.com/api/oauth/callback"
    ]
    prod = [
      "https://app.opsai.com/api/oauth/callback"
    ]
  }
  
  # Get all redirect URIs for current environment
  redirect_uris = concat(
    local.oauth_redirect_uris[var.environment],
    var.environment == "dev" ? [] : local.oauth_redirect_uris["dev"] # Include dev URIs in higher environments
  )
}

# GitHub OAuth App (requires GitHub provider - not implemented here)
# Manual configuration required at: https://github.com/settings/developers
output "github_oauth_config" {
  value = {
    client_id = var.oauth_providers.github.client_id
    redirect_uris = local.redirect_uris
    homepage_url = var.environment == "dev" ? "http://localhost:7250" : "https://app.opsai.com"
    authorization_callback_urls = local.redirect_uris
  }
  description = "GitHub OAuth App configuration - apply manually at https://github.com/settings/developers"
  sensitive = true
}

# Google OAuth 2.0 Client (can be managed via google provider)
# For now, output configuration for manual setup
output "google_oauth_config" {
  value = {
    client_id = var.oauth_providers.google.client_id
    authorized_redirect_uris = local.redirect_uris
    authorized_javascript_origins = var.environment == "dev" ? [
      "http://localhost:7250",
      "http://localhost:3000",
      "http://localhost:3003"
    ] : [
      "https://app.opsai.com"
    ]
    scopes = [
      "openid",
      "email", 
      "profile",
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/calendar.readonly"
    ]
  }
  description = "Google OAuth configuration - apply at https://console.cloud.google.com"
  sensitive = true
}

# Stripe OAuth Settings
output "stripe_oauth_config" {
  value = {
    client_id = var.oauth_providers.stripe.client_id
    redirect_uris = local.redirect_uris
    platform_name = "OpsAI Platform"
  }
  description = "Stripe Connect configuration - apply at https://dashboard.stripe.com/settings/connect"
  sensitive = true
}

# Shopify App Configuration
output "shopify_oauth_config" {
  value = {
    client_id = var.oauth_providers.shopify.client_id
    redirect_urls = local.redirect_uris
    app_url = var.environment == "dev" ? "http://localhost:7250" : "https://app.opsai.com"
    scopes = [
      "read_products",
      "read_orders", 
      "read_customers",
      "read_inventory",
      "read_analytics"
    ]
  }
  description = "Shopify App configuration - apply at https://partners.shopify.com"
  sensitive = true
}

# Calendly OAuth Configuration
output "calendly_oauth_config" {
  value = {
    client_id = var.oauth_providers.calendly.client_id
    redirect_uri = local.redirect_uris[0] # Calendly only supports one redirect URI
    scopes = ["default"]
  }
  description = "Calendly OAuth configuration - apply in Calendly developer portal"
  sensitive = true
}

# Resource to validate OAuth configurations
resource "null_resource" "validate_oauth_setup" {
  # This will run when OAuth providers change
  triggers = {
    oauth_providers = jsonencode(var.oauth_providers)
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "🔐 OAuth Configuration Summary for ${var.environment}:"
      echo "=================================="
      echo ""
      echo "Redirect URIs configured:"
      %{ for uri in local.redirect_uris ~}
      echo "  - ${uri}"
      %{ endfor ~}
      echo ""
      echo "Enabled OAuth Providers:"
      %{ for provider, config in var.oauth_providers ~}
      %{ if config.enabled ~}
      echo "  ✅ ${provider}"
      echo "     Client ID: ${substr(config.client_id, 0, 10)}..."
      %{ endif ~}
      %{ endfor ~}
      echo ""
      echo "⚠️  IMPORTANT: Update each OAuth provider's settings with the redirect URIs above!"
      echo ""
      echo "Provider URLs:"
      echo "  GitHub: https://github.com/settings/developers"
      echo "  Google: https://console.cloud.google.com/apis/credentials" 
      echo "  Stripe: https://dashboard.stripe.com/settings/connect"
      echo "  Shopify: https://partners.shopify.com"
      echo "  Calendly: Developer portal"
    EOT
  }
}

# Future enhancement: Use provider-specific resources to manage OAuth apps
# Example for Google (requires google provider):
# resource "google_iap_client" "oauth_client" {
#   display_name = "OpsAI Platform ${var.environment}"
#   brand        = google_iap_brand.project_brand.name
# }