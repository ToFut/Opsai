# Airbyte Infrastructure Management with Terraform

This directory contains Terraform configurations to manage your entire Airbyte infrastructure as code, including sources, destinations, and connections for all your OAuth providers and data pipelines.

## 🏗️ Architecture Overview

The Terraform configuration manages:
- **13 OAuth Sources**: GitHub, Salesforce, Shopify, HubSpot, Stripe, QuickBooks, Square, Xero, Slack, Mailchimp, Zendesk, Calendly, Google Workspace
- **8 Destinations**: PostgreSQL, Supabase, BigQuery, Snowflake, S3, ClickHouse, Elasticsearch, Local JSON (dev)
- **Automated Connections**: Smart routing between sources and destinations with optimized sync schedules
- **Multi-Environment Support**: Dev, staging, and production configurations

## 📁 File Structure

```
terraform/
├── main.tf              # Provider configuration
├── variables.tf         # Input variables and configuration
├── terraform.tfvars.example  # Example variable values
├── sources.tf          # Airbyte source definitions
├── destinations.tf     # Airbyte destination definitions
├── connections.tf      # Source-to-destination connections
├── backend.tf          # Remote state configuration
├── outputs.tf          # Resource outputs
└── README.md           # This documentation
```

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

# Verify installation
terraform --version
```

### 2. Configure Environment

```bash
# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your actual values
nano terraform.tfvars
```

### 3. Initialize and Deploy

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply changes
terraform apply
```

## ⚙️ Configuration

### Required Variables

Update `terraform.tfvars` with your actual values:

```hcl
# Airbyte Configuration
airbyte_api_key       = "your-actual-api-key"
airbyte_workspace_id  = "your-actual-workspace-id"
airbyte_client_id     = "your-actual-client-id"
airbyte_client_secret = "your-actual-client-secret"

# Environment
environment   = "prod"  # or "dev", "staging"
project_name  = "opsai"

# OAuth Providers - Enable only what you need
oauth_providers = {
  github = {
    client_id     = "your-github-client-id"
    client_secret = "your-github-client-secret"
    enabled       = true
  }
  salesforce = {
    client_id     = "your-salesforce-client-id"
    client_secret = "your-salesforce-client-secret"
    enabled       = true
  }
  # ... other providers
}
```

### OAuth Provider Setup

For each provider you want to enable, you'll need:

1. **OAuth Credentials**: Client ID and Client Secret from the provider's developer console
2. **Initial Authentication**: Complete OAuth flow once to get refresh tokens
3. **Provider-Specific Configuration**: Additional fields like domain names, account IDs, etc.

## 🔄 Data Pipeline Architecture

### Source → Destination Routing

The configuration automatically creates optimized data pipelines:

| Source | Primary Destination | Analytics Destination | Sync Frequency |
|--------|-------------------|---------------------|----------------|
| GitHub | PostgreSQL | BigQuery | Daily (2 AM) |
| Salesforce | PostgreSQL | BigQuery | Every 6 hours |
| Shopify | PostgreSQL | BigQuery | Every 4 hours |
| HubSpot | PostgreSQL | BigQuery | Every 3 hours |
| Stripe | PostgreSQL | BigQuery | Every 2 hours |
| QuickBooks | PostgreSQL | BigQuery | Daily (4 AM) |
| Others | PostgreSQL | BigQuery | Configurable |

### Sync Modes

- **Full Refresh**: Complete data replacement (repositories, product catalogs)
- **Incremental**: Only new/changed records (transactions, events)
- **Deduped History**: Historical tracking with deduplication (CRM records)

## 🛠️ Management Commands

### View Infrastructure

```bash
# Show current state
terraform show

# List all resources
terraform state list

# Show specific resource
terraform state show airbyte_source_github.github_source[0]
```

### Update Configuration

```bash
# Plan changes
terraform plan

# Apply changes
terraform apply

# Apply specific resources
terraform apply -target=airbyte_source_github.github_source[0]
```

### Troubleshooting

```bash
# Validate configuration
terraform validate

# Format configuration
terraform fmt

# Refresh state
terraform refresh

# Import existing resources
terraform import airbyte_source_github.github_source[0] <source-id>
```

## 🔒 Security Best Practices

### State Management

- **Remote State**: Uses S3 backend with encryption and DynamoDB locking
- **State Encryption**: All state files are encrypted at rest
- **Access Control**: IAM policies restrict state file access

### Credential Management

- **Sensitive Variables**: All secrets marked as `sensitive = true`
- **Environment Variables**: Use `TF_VAR_` prefix for CI/CD
- **Vault Integration**: Consider HashiCorp Vault for production

```bash
# Set environment variables for CI/CD
export TF_VAR_airbyte_api_key="your-api-key"
export TF_VAR_airbyte_client_secret="your-client-secret"
```

## 🌍 Multi-Environment Setup

### Directory Structure

```
terraform/
├── environments/
│   ├── dev/
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── prod/
│       ├── terraform.tfvars
│       └── backend.tf
└── modules/
    └── airbyte/
        ├── sources.tf
        ├── destinations.tf
        └── connections.tf
```

### Environment-Specific Deployment

```bash
# Development
cd environments/dev
terraform init
terraform apply

# Production
cd environments/prod
terraform init
terraform apply
```

## 📊 Monitoring and Alerting

### Resource Monitoring

```bash
# Check connection status
terraform output postgres_connection_ids

# View source health
terraform output source_ids
```

### Integration with Monitoring Tools

The outputs can be used to configure monitoring:

```hcl
# Use outputs in monitoring configuration
resource "datadog_monitor" "airbyte_sync_failure" {
  name    = "Airbyte Sync Failure"
  type    = "metric alert"
  query   = "avg(last_5m):airbyte.connection.sync_failure{connection_id:${terraform.output.postgres_connection_ids.github}} > 0"
  message = "Airbyte GitHub sync failed"
}
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Airbyte Infrastructure

on:
  push:
    branches: [main]
    paths: ['terraform/**']

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        
      - name: Terraform Init
        run: terraform init
        working-directory: ./terraform
        
      - name: Terraform Plan
        run: terraform plan
        working-directory: ./terraform
        env:
          TF_VAR_airbyte_api_key: ${{ secrets.AIRBYTE_API_KEY }}
          
      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve
        working-directory: ./terraform
        env:
          TF_VAR_airbyte_api_key: ${{ secrets.AIRBYTE_API_KEY }}
```

## 🔧 Advanced Configuration

### Custom Source Definitions

For custom APIs not supported by standard connectors:

```hcl
# Custom API source using auto-connector
resource "airbyte_source_custom" "custom_api" {
  name         = "custom-api-source"
  workspace_id = var.airbyte_workspace_id
  
  configuration = {
    connector_manifest = file("${path.module}/manifests/custom-api.yaml")
  }
}
```

### Dynamic Stream Selection

```hcl
# Dynamic stream configuration based on environment
locals {
  production_streams = var.environment == "prod" ? [
    "orders", "customers", "products", "transactions"
  ] : ["orders"]
}
```

### Connection Optimization

```hcl
# High-frequency connections for critical data
resource "airbyte_connection" "stripe_realtime" {
  count = var.environment == "prod" ? 1 : 0
  
  schedule = {
    schedule_type   = "cron"
    cron_expression = "*/15 * * * *" # Every 15 minutes
  }
}
```

## 🚨 Troubleshooting Guide

### Common Issues

1. **Provider Authentication**
   ```bash
   Error: authentication failed
   Solution: Verify API key and workspace ID in terraform.tfvars
   ```

2. **Resource Already Exists**
   ```bash
   Error: resource already exists
   Solution: Import existing resource or update configuration
   terraform import airbyte_source_github.github_source[0] <existing-id>
   ```

3. **OAuth Token Expired**
   ```bash
   Error: oauth token expired
   Solution: Refresh tokens through Airbyte UI, then update Terraform
   ```

### Debug Mode

```bash
# Enable detailed logging
export TF_LOG=DEBUG
export TF_LOG_PATH=./terraform-debug.log

# Run with debug output
terraform apply
```

## 📈 Scaling and Performance

### Resource Limits

- **Sources**: Up to 100 per workspace
- **Destinations**: Up to 50 per workspace  
- **Connections**: Up to 500 per workspace
- **Concurrent Syncs**: Up to 10 by default

### Performance Optimization

```hcl
# Optimize sync schedules based on data volume
variable "sync_schedules" {
  type = map(string)
  default = {
    low_volume    = "0 6 * * *"      # Daily
    medium_volume = "0 */6 * * *"    # Every 6 hours
    high_volume   = "0 */2 * * *"    # Every 2 hours
    real_time     = "*/15 * * * *"   # Every 15 minutes
  }
}
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-source`
3. **Update Terraform configs**: Add new sources/destinations
4. **Test changes**: `terraform plan`
5. **Submit pull request**: Include test results

### Adding New Sources

1. Add source definition in `sources.tf`
2. Add connection configuration in `connections.tf`
3. Update variables in `variables.tf`
4. Update outputs in `outputs.tf`
5. Update documentation

## 📚 Additional Resources

- [Airbyte Terraform Provider Documentation](https://registry.terraform.io/providers/airbytehq/airbyte/latest/docs)
- [Airbyte API Documentation](https://reference.airbyte.com/reference/start)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
- [OAuth Integration Guides](https://docs.airbyte.com/integrations/sources/)

## 🆘 Support

For issues and questions:

1. Check the [troubleshooting guide](#-troubleshooting-guide)
2. Review [Airbyte documentation](https://docs.airbyte.com/)
3. Open an issue in the repository
4. Contact the platform team

---

**🚀 Happy Data Engineering!** This Terraform configuration provides a solid foundation for managing your entire Airbyte infrastructure as code, ensuring consistency, reliability, and easy scaling across environments.