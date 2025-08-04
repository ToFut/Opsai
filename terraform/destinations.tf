# Fixed Destinations Configuration for Airbyte Terraform Provider
# Using correct resource types and configuration structure

# PostgreSQL Destination (Primary Data Warehouse)
resource "airbyte_destination_postgres" "postgres_destination" {
  definition_id = "25c5221d-dce2-4163-ade9-739ef790f503"
  name          = "${var.project_name}-postgres-${var.environment}"
  workspace_id  = var.airbyte_workspace_id
  
  configuration = {
    host     = "your-postgres-host"
    port     = 5432
    database = "${var.project_name}_${var.environment}"
    schema   = "public"
    username = "your-postgres-user"
    password = "your-postgres-password"
    ssl_mode = {
      mode = "require"
    }
  }
}

# BigQuery Destination (For Analytics) - DISABLED due to definition ID not found
# resource "airbyte_destination_bigquery" "bigquery_destination" {
#   definition_id = "22f6c74f-5699-40ff-af54-d775532323ac"
#   name          = "${var.project_name}-bigquery-${var.environment}"
#   workspace_id  = var.airbyte_workspace_id
#   
#   configuration = {
#     project_id       = "your-gcp-project-id"
#     dataset_location = "US"
#     dataset_id       = "${var.project_name}_${var.environment}"
#     credentials_json = jsonencode({
#       type                        = "service_account"
#       project_id                  = "your-gcp-project-id"
#       private_key_id              = "your-private-key-id"
#       private_key                 = "your-private-key"
#       client_email                = "your-service-account-email"
#       client_id                   = "your-client-id"
#       auth_uri                    = "https://accounts.google.com/o/oauth2/auth"
#       token_uri                   = "https://oauth2.googleapis.com/token"
#       auth_provider_x509_cert_url = "https://www.googleapis.com/oauth2/v1/certs"
#     })
#     loading_method = {
#       method = "Standard Inserts"
#     }
#   }
# }

# Supabase Destination (PostgreSQL-compatible)
resource "airbyte_destination_postgres" "supabase_destination" {
  definition_id = "25c5221d-dce2-4163-ade9-739ef790f503"
  name          = "${var.project_name}-supabase-${var.environment}"
  workspace_id  = var.airbyte_workspace_id
  
  configuration = {
    host     = "aws-0-us-east-1.pooler.supabase.com"
    port     = 5432
    database = "postgres"
    schema   = "public"
    username = "postgres.wrkzrmvwxxtsdpyhrxhz"
    password = "OpsAi-postgresql-2024"
    ssl_mode = {
      mode = "require"
    }
  }
}

# S3 Destination (For Data Lake) - DISABLED due to format configuration issue
# resource "airbyte_destination_s3" "s3_destination" {
#   definition_id = "4816b78f-1489-44c1-9060-4b19d5fa9362"
#   name          = "${var.project_name}-s3-${var.environment}"
#   workspace_id  = var.airbyte_workspace_id
#   
#   configuration = {
#     s3_bucket_name    = "${var.project_name}-data-lake-${var.environment}"
#     s3_bucket_path    = "airbyte-data"
#     s3_bucket_region  = "us-east-1"
#     access_key_id     = "your-aws-access-key-id"
#     secret_access_key = "your-aws-secret-access-key"
#     format = {
#       format_type = "JSONL"
#       compression = {
#         compression_type = "No Compression"
#       }
#     }
#   }
# }