# Dynamic variables for user-specific OAuth data

variable "github_repositories" {
  description = "List of GitHub repositories to sync (from user selection)"
  type        = list(string)
  default     = ["airbytehq/airbyte"]  # Placeholder until user selects
}

variable "google_analytics_properties" {
  description = "List of GA property IDs to sync (from user selection)"
  type        = list(string)
  default     = ["123456789"]  # Placeholder until user selects
}

variable "shopify_shop_domain" {
  description = "Shopify shop domain (from OAuth callback)"
  type        = string
  default     = "test-shop"  # Placeholder until user connects
}

variable "github_access_token" {
  description = "GitHub personal access token (from OAuth)"
  type        = string
  sensitive   = true
  default     = ""  # Set during OAuth flow
}

variable "google_refresh_token" {
  description = "Google OAuth refresh token"
  type        = string
  sensitive   = true
  default     = ""  # Set during OAuth flow
}