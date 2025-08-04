# Airbyte Resource Outputs

# Source IDs
output "source_ids" {
  description = "Map of source IDs by provider name"
  value = {
    # github disabled temporarily
    salesforce = var.oauth_providers.salesforce.enabled ? airbyte_source_salesforce.salesforce_source[0].source_id : null
    shopify    = var.oauth_providers.shopify.enabled ? airbyte_source_shopify.shopify_source[0].source_id : null
    hubspot    = var.oauth_providers.hubspot.enabled ? airbyte_source_hubspot.hubspot_source[0].source_id : null
    stripe     = var.oauth_providers.stripe.enabled ? airbyte_source_stripe.stripe_source[0].source_id : null
    square     = var.oauth_providers.square.enabled ? airbyte_source_square.square_source[0].source_id : null
    mailchimp  = var.oauth_providers.mailchimp.enabled ? airbyte_source_mailchimp.mailchimp_source[0].source_id : null
    zendesk    = var.oauth_providers.zendesk.enabled ? airbyte_source_zendesk_support.zendesk_source[0].source_id : null
    calendly   = null # Disabled - incorrect definition ID
    # google disabled temporarily
  }
}

# Destination IDs
output "destination_ids" {
  description = "Map of destination IDs by type"
  value = {
    postgres = airbyte_destination_postgres.postgres_destination.destination_id
    supabase = airbyte_destination_postgres.supabase_destination.destination_id
    bigquery = null # Disabled - definition not found
    s3       = null # Disabled - format configuration issue
  }
}

# Connection IDs for Supabase Connections
output "supabase_connection_ids" {
  description = "Map of connection IDs for Supabase destination"
  value = {
    stripe   = var.oauth_providers.stripe.enabled ? airbyte_connection.stripe_to_supabase[0].connection_id : null
    shopify  = null # Connection disabled due to connector issues
    # calendly not supported by provider
  }
}

# PostgreSQL Connection IDs only (remove BigQuery until implemented)
# output "bigquery_connection_ids" {
#   description = "Map of connection IDs for BigQuery destinations"
#   value = {
#     for provider, config in var.oauth_providers : provider => airbyte_connection.all_to_bigquery[provider].connection_id
#     if config.enabled
#   }
# }

# Workspace Information
output "workspace_id" {
  description = "Airbyte workspace ID"
  value       = var.airbyte_workspace_id
}

# Environment Information
output "environment" {
  description = "Current environment"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

# Source Names for Reference
output "source_names" {
  description = "Map of source names by provider"
  value = {
    salesforce = var.oauth_providers.salesforce.enabled ? airbyte_source_salesforce.salesforce_source[0].name : null
    shopify    = var.oauth_providers.shopify.enabled ? airbyte_source_shopify.shopify_source[0].name : null
    hubspot    = var.oauth_providers.hubspot.enabled ? airbyte_source_hubspot.hubspot_source[0].name : null
    stripe     = var.oauth_providers.stripe.enabled ? airbyte_source_stripe.stripe_source[0].name : null
    square     = var.oauth_providers.square.enabled ? airbyte_source_square.square_source[0].name : null
    mailchimp  = var.oauth_providers.mailchimp.enabled ? airbyte_source_mailchimp.mailchimp_source[0].name : null
    zendesk    = var.oauth_providers.zendesk.enabled ? airbyte_source_zendesk_support.zendesk_source[0].name : null
    calendly   = null # Disabled - incorrect definition ID
  }
}

# Destination Names for Reference
output "destination_names" {
  description = "Map of destination names by type"
  value = {
    postgres = airbyte_destination_postgres.postgres_destination.name
    bigquery = null # Disabled - definition not found
    s3       = null # Disabled - format configuration issue
  }
}

# Summary Information
output "airbyte_infrastructure_summary" {
  description = "Summary of deployed Airbyte infrastructure"
  sensitive   = true
  value = {
    environment  = var.environment
    project_name = var.project_name
    workspace_id = var.airbyte_workspace_id
    enabled_sources = [
      for provider, config in var.oauth_providers : provider
      if config.enabled
    ]
    total_sources      = length([for provider, config in var.oauth_providers : provider if config.enabled])
    total_destinations = 2 # postgres and supabase
    total_connections  = length([for provider, config in var.oauth_providers : provider if config.enabled])
  }
}