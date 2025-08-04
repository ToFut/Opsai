# Terraform Backend Configuration
# This file configures remote state storage and locking

# S3 Backend for Production State Management
# Commented out for local testing - uncomment for production use
# terraform {
#   backend "s3" {
#     # S3 Backend Configuration
#     # Note: Variables cannot be used in backend configuration
#     # Use terraform init -backend-config for environment-specific configs
#     bucket         = "opsai-terraform-state"
#     key            = "airbyte/terraform.tfstate"
#     region         = "us-east-1"
#     encrypt        = true
#     dynamodb_table = "opsai-terraform-locks"
#   }
# }

# Alternative: Terraform Cloud Backend
# Uncomment this block if you prefer to use Terraform Cloud
/*
terraform {
  cloud {
    organization = "your-organization-name"
    
    workspaces {
      name = "opsai-airbyte-${var.environment}"
    }
  }
}
*/

# Alternative: Local Backend (for development only)
# Using local backend for testing
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}