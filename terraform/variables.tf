variable "airbyte_api_key" {
  description = "Airbyte API key for authentication"
  type        = string
  sensitive   = true
}

variable "airbyte_api_url" {
  description = "Airbyte API URL"
  type        = string
  default     = "https://api.airbyte.com/v1"
}

variable "airbyte_workspace_id" {
  description = "Airbyte workspace ID"
  type        = string
}

variable "airbyte_client_id" {
  description = "Airbyte OAuth client ID"
  type        = string
  sensitive   = true
}

variable "airbyte_client_secret" {
  description = "Airbyte OAuth client secret"
  type        = string
  sensitive   = true
}

# OAuth Provider Configuration Variables
variable "oauth_providers" {
  description = "OAuth provider configurations"
  type = map(object({
    client_id     = string
    client_secret = string
    enabled       = bool
  }))
  default   = {}
  sensitive = true
}

# Environment variables
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "opsai"
}