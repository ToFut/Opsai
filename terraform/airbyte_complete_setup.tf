# Complete Airbyte Setup with DB Organization and AI Analysis

# ========================================
# 1. FIXED CONNECTION CONFIGURATIONS
# ========================================

# Fixed Stripe to Supabase Connection
resource "airbyte_connection" "stripe_to_supabase_fixed" {
  count = var.oauth_providers.stripe.enabled ? 1 : 0
  
  name           = "${var.project_name}-stripe-user-${var.user_id}"
  source_id      = airbyte_source_stripe.stripe_source[0].source_id
  destination_id = airbyte_destination_postgres.supabase_destination.destination_id
  
  # User-specific namespace for data isolation
  namespace_definition = "custom_format"
  namespace_format     = "user_${var.user_id}"
  
  # Prefix tables for better organization
  prefix = "stripe_"
  
  # Non-breaking schema updates
  non_breaking_schema_updates_behavior = "propagate_columns"
  
  schedule = {
    schedule_type   = "cron"
    cron_expression = "0 0 */2 * * ?"  # Every 2 hours
  }
}

# Fixed GitHub to Supabase Connection
resource "airbyte_connection" "github_to_supabase_fixed" {
  count = var.oauth_providers.github.enabled ? 1 : 0
  
  name           = "${var.project_name}-github-user-${var.user_id}"
  source_id      = airbyte_source_github.github_source[0].source_id
  destination_id = airbyte_destination_postgres.supabase_destination.destination_id
  
  namespace_definition = "custom_format"
  namespace_format     = "user_${var.user_id}"
  prefix              = "github_"
  
  non_breaking_schema_updates_behavior = "propagate_columns"
  
  schedule = {
    schedule_type   = "cron"
    cron_expression = "0 0 */3 * * ?"  # Every 3 hours
  }
}

# Fixed Shopify to Supabase Connection
resource "airbyte_connection" "shopify_to_supabase_fixed" {
  count = var.oauth_providers.shopify.enabled ? 1 : 0
  
  name           = "${var.project_name}-shopify-user-${var.user_id}"
  source_id      = airbyte_source_shopify.shopify_source[0].source_id
  destination_id = airbyte_destination_postgres.supabase_destination.destination_id
  
  namespace_definition = "custom_format"
  namespace_format     = "user_${var.user_id}"
  prefix              = "shopify_"
  
  non_breaking_schema_updates_behavior = "propagate_columns"
  
  schedule = {
    schedule_type   = "cron"
    cron_expression = "0 0 */4 * * ?"  # Every 4 hours
  }
}

# Fixed Google Analytics to Supabase Connection
resource "airbyte_connection" "google_to_supabase_fixed" {
  count = var.oauth_providers.google.enabled ? 1 : 0
  
  name           = "${var.project_name}-google-analytics-user-${var.user_id}"
  source_id      = airbyte_source_google_analytics_data_api.google_analytics_source[0].source_id
  destination_id = airbyte_destination_postgres.supabase_destination.destination_id
  
  namespace_definition = "custom_format"  
  namespace_format     = "user_${var.user_id}"
  prefix              = "ga_"
  
  non_breaking_schema_updates_behavior = "propagate_columns"
  
  schedule = {
    schedule_type   = "cron"
    cron_expression = "0 0 * * * ?"  # Daily
  }
}