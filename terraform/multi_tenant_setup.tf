# Multi-Tenant Setup for Airbyte

# Variable for user identification
variable "user_id" {
  description = "Unique identifier for the user/tenant"
  type        = string
  default     = "shared"  # Use 'shared' for testing, real user ID in production
}

# Example: Per-User Stripe Connection
resource "airbyte_connection" "stripe_to_supabase_per_user" {
  count = var.oauth_providers.stripe.enabled ? 1 : 0
  
  # Unique name per user
  name = "${var.project_name}-stripe-user-${var.user_id}"
  
  source_id      = airbyte_source_stripe.stripe_source[0].source_id
  destination_id = airbyte_destination_postgres.supabase_destination.destination_id
  
  # IMPORTANT: Each user gets their own schema
  namespace_definition = "custom_format"
  namespace_format     = "user_${var.user_id}"
  
  schedule = {
    schedule_type   = "cron"
    cron_expression = "0 0 */2 * * ?"
  }
}

# This creates tables like:
# user_123.stripe_customers
# user_123.stripe_charges
# user_456.stripe_customers
# user_456.stripe_charges

# For production, you would run:
# terraform apply -var="user_id=123" -var="stripe_api_key=sk_live_xxx"