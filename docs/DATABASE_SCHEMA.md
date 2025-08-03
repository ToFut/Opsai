# OpsAI Database Schema Documentation

## Overview

OpsAI uses a multi-tenant architecture with PostgreSQL (via Supabase) as the primary database. Each tenant has isolated resources and data.

## Core Tables

### 1. `tenants`
Main tenant registry table.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | VARCHAR(255) | Unique tenant identifier (e.g., 'tenant_abc123') |
| name | VARCHAR(255) | Company/tenant name |
| business_profile | JSONB | Industry, size, type, description |
| status | VARCHAR(50) | active, suspended, deleted |
| subscription_tier | VARCHAR(50) | free, starter, pro, enterprise |
| usage_limits | JSONB | Connection limits, sync limits, etc. |

### 2. `tenant_integrations`
Tracks which integrations each tenant has connected.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | VARCHAR(255) | Foreign key to tenants |
| provider | VARCHAR(100) | Integration provider (salesforce, stripe, etc.) |
| status | VARCHAR(50) | pending, connected, failed, disconnected |
| connected_at | TIMESTAMP | When the integration was connected |
| configuration | JSONB | Provider-specific config (non-sensitive) |
| features_enabled | JSONB | Features this integration enables |

### 3. `tenant_sources`
Airbyte source configurations for each tenant.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | VARCHAR(255) | Foreign key to tenants |
| airbyte_source_id | VARCHAR(255) | Airbyte's source ID |
| source_type | VARCHAR(100) | postgres, salesforce, stripe, etc. |
| name | VARCHAR(255) | User-friendly source name |
| status | VARCHAR(50) | pending, active, failed, deleted |
| discovered_schema | JSONB | Schema discovered from source |
| sample_data | JSONB | Sample data for UI generation |

### 4. `tenant_airbyte_connections`
Tracks data sync connections in Airbyte.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | VARCHAR(255) | Foreign key to tenants |
| source_id | UUID | Foreign key to tenant_sources |
| airbyte_connection_id | VARCHAR(255) | Airbyte's connection ID |
| status | VARCHAR(50) | pending, active, paused, failed |
| sync_frequency | VARCHAR(50) | manual, hourly, daily, weekly |
| sync_stats | JSONB | Records synced, errors, etc. |

### 5. `oauth_states`
Temporary storage for OAuth flow security.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| state_token | VARCHAR(255) | Unique OAuth state token |
| tenant_id | VARCHAR(255) | Foreign key to tenants |
| provider | VARCHAR(100) | OAuth provider |
| redirect_uri | TEXT | Where to redirect after OAuth |
| expires_at | TIMESTAMP | Token expiration (10 min) |
| used | BOOLEAN | Whether token was used |

### 6. `tenant_apps`
Generated applications for each tenant.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | VARCHAR(255) | Foreign key to tenants |
| app_name | VARCHAR(255) | Application name |
| app_type | VARCHAR(100) | b2b, b2c, saas, marketplace |
| deployment_url | TEXT | Live app URL |
| vercel_project_id | VARCHAR(255) | Vercel project identifier |
| status | VARCHAR(50) | generating, deployed, failed |
| features | JSONB | Enabled features list |
| database_schema | VARCHAR(255) | Tenant's DB schema name |

### 7. `tenant_workflows`
Workflow configurations per tenant.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | VARCHAR(255) | Foreign key to tenants |
| workflow_name | VARCHAR(255) | Workflow identifier |
| workflow_type | VARCHAR(100) | onboarding, data_sync, notification |
| enabled | BOOLEAN | Whether workflow is active |
| configuration | JSONB | Workflow-specific config |
| schedule | VARCHAR(100) | Cron expression or schedule |

### 8. `audit_logs`
Compliance and debugging audit trail.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | VARCHAR(255) | Foreign key to tenants |
| action | VARCHAR(255) | integration.connected, app.deployed, etc. |
| actor_id | VARCHAR(255) | User or system that performed action |
| resource_type | VARCHAR(100) | Type of resource affected |
| resource_id | VARCHAR(255) | ID of affected resource |
| metadata | JSONB | Additional context |
| ip_address | INET | Client IP address |
| created_at | TIMESTAMP | When action occurred |

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Service role can access all data
- Tenants can only access their own data
- Public/anon access is blocked

### Data Isolation
- Each tenant has a unique `tenant_id`
- Database schemas are isolated: `tenant_${tenant_id}`
- File storage uses separate buckets per tenant
- Redis uses namespaced keys: `tenant:${tenant_id}:*`

### OAuth Security
- State tokens expire after 10 minutes
- Tokens are single-use
- All OAuth flows tracked in audit logs

## Indexes

Performance indexes on:
- Foreign keys (tenant_id)
- Status fields
- Timestamps (for sorting)
- Provider/source types
- OAuth state tokens

## Triggers

- `updated_at` automatically updates on row changes
- Expired OAuth states cleaned up via cron job

## Usage Examples

### Create a new tenant
```sql
INSERT INTO tenants (tenant_id, name, business_profile) 
VALUES (
  'tenant_xyz789',
  'Acme Corp',
  '{"industry": "ecommerce", "size": "large", "type": "b2c"}'
);
```

### Track integration connection
```sql
INSERT INTO tenant_integrations (tenant_id, provider, status, features_enabled)
VALUES (
  'tenant_xyz789',
  'stripe',
  'connected',
  '["payments", "subscriptions", "invoicing"]'
);
```

### Record Airbyte source
```sql
INSERT INTO tenant_sources (tenant_id, airbyte_source_id, source_type, name)
VALUES (
  'tenant_xyz789',
  'src_123abc',
  'stripe',
  'Production Stripe Account'
);
```

### Audit log entry
```sql
INSERT INTO audit_logs (tenant_id, action, actor_id, resource_type, resource_id)
VALUES (
  'tenant_xyz789',
  'integration.connected',
  'user_123',
  'integration',
  'stripe'
);
```

## Migration

To apply the schema:

1. **Via Supabase Dashboard:**
   - Go to SQL Editor
   - Copy contents of `supabase/migrations/001_multi_tenant_schema.sql`
   - Run the SQL

2. **Via Supabase CLI:**
   ```bash
   supabase db push
   ```

3. **Via Script:**
   ```bash
   npm run migrate:supabase
   ```

## Best Practices

1. Always use `tenant_id` in queries for data isolation
2. Log all significant actions to audit_logs
3. Clean up expired OAuth states regularly
4. Monitor usage_limits to prevent abuse
5. Use transactions for multi-table operations
6. Index any fields used in WHERE clauses frequently