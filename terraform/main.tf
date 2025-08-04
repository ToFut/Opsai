terraform {
  required_version = ">= 1.0"
  required_providers {
    airbyte = {
      source  = "airbytehq/airbyte"
      version = "~> 0.13"
    }
  }
}

# Configure the Airbyte Provider
provider "airbyte" {
  # Use OAuth2 client credentials for automatic token refresh
  client_id     = var.airbyte_client_id
  client_secret = var.airbyte_client_secret
  server_url    = var.airbyte_api_url
}