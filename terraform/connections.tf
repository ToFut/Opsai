# Connections Configuration - All Sources to Supabase
# Each enabled source connects directly to Supabase destination

# Stripe to Supabase Connection
resource "airbyte_connection" "stripe_to_supabase" {
  count = var.oauth_providers.stripe.enabled ? 1 : 0
  
  name           = "${var.project_name}-stripe-supabase-${var.environment}"
  source_id      = airbyte_source_stripe.stripe_source[0].source_id
  destination_id = airbyte_destination_postgres.supabase_destination.destination_id
  
  # Use default stream configuration initially
  # configurations will be updated after connection is created
  
  schedule = {
    schedule_type   = "cron"
    cron_expression = "0 0 */2 * * ?"  # Every 2 hours at the hour
  }
}

# Shopify to Supabase Connection - DISABLED due to connector issues
# resource "airbyte_connection" "shopify_to_supabase" {
#   count = var.oauth_providers.shopify.enabled ? 1 : 0
#   
#   name           = "${var.project_name}-shopify-supabase-${var.environment}"
#   source_id      = airbyte_source_shopify.shopify_source[0].source_id
#   destination_id = airbyte_destination_postgres.supabase_destination.destination_id
#   
#   # Use default stream configuration initially
#   # configurations will be updated after connection is created
#   
#   schedule = {
#     schedule_type   = "cron"
#     cron_expression = "0 0 */4 * * ?"  # Every 4 hours at the hour
#   }
# }

# Calendly to Supabase Connection - DISABLED: Calendly not supported
# resource "airbyte_connection" "calendly_to_supabase" {
#   count = var.oauth_providers.calendly.enabled ? 1 : 0
#   
#   name           = "${var.project_name}-calendly-supabase-${var.environment}"
#   source_id      = airbyte_source_calendly.calendly_source[0].source_id
#   destination_id = airbyte_destination_postgres.supabase_destination.destination_id
#   
#   # Use default stream configuration initially
#   # configurations will be updated after connection is created
#   
#   schedule = {
#     schedule_type   = "cron"
#     cron_expression = "0 0 */6 * * ?"  # Every 6 hours
#   }
# }

# GitHub to Supabase Connection
resource "airbyte_connection" "github_to_supabase" {
  count = var.oauth_providers.github.enabled ? 1 : 0
  
  name           = "${var.project_name}-github-supabase-${var.environment}"
  source_id      = airbyte_source_github.github_source[0].source_id
  destination_id = airbyte_destination_postgres.supabase_destination.destination_id
  
  # Use default stream configuration initially
  # configurations will be updated after connection is created
  
  schedule = {
    schedule_type   = "cron"
    cron_expression = "0 0 */3 * * ?"  # Every 3 hours
  }
}

# Google Analytics to Supabase Connection
resource "airbyte_connection" "google_to_supabase" {
  count = var.oauth_providers.google.enabled ? 1 : 0
  
  name           = "${var.project_name}-google-supabase-${var.environment}"
  source_id      = airbyte_source_google_analytics_data_api.google_analytics_source[0].source_id
  destination_id = airbyte_destination_postgres.supabase_destination.destination_id
  
  # Use default stream configuration initially
  # configurations will be updated after connection is created
  
  schedule = {
    schedule_type   = "cron"
    cron_expression = "0 0 * * * ?"  # Daily
  }
}

# Local source mapping for reference
locals {
  source_ids_fixed = {
    github     = var.oauth_providers.github.enabled ? airbyte_source_github.github_source[0].source_id : null
    shopify    = var.oauth_providers.shopify.enabled ? airbyte_source_shopify.shopify_source[0].source_id : null
    stripe     = var.oauth_providers.stripe.enabled ? airbyte_source_stripe.stripe_source[0].source_id : null
    # calendly disabled - not supported by provider
    google     = var.oauth_providers.google.enabled ? airbyte_source_google_analytics_data_api.google_analytics_source[0].source_id : null
  }
}