# OpsAI Testing Guide

## Overview

This guide explains how to test the new Airbyte-first architecture and dynamic schema generation system.

## Prerequisites

1. **Environment Setup**
   ```bash
   # Install dependencies
   pnpm install
   
   # Copy .env.example to .env and fill in values
   cp .env.example .env
   ```

2. **Supabase Database**
   ```bash
   # Apply database migrations
   npm run migrate:supabase
   ```

3. **Airbyte Setup**
   - Sign up for [Airbyte Cloud](https://cloud.airbyte.com) (14-day free trial)
   - Get your API key and workspace ID
   - Add to .env file

## Testing Flow

### 1. Test Multi-Tenant Database

```bash
# Run migration script
npm run migrate:supabase

# Check tables in Supabase dashboard
# Should see: tenants, tenant_integrations, tenant_sources, etc.
```

### 2. Test Onboarding with Airbyte Integration

1. **Start the app**
   ```bash
   cd apps/opsai-onboarding
   npm run dev
   ```

2. **Navigate to Production Onboarding**
   - Open http://localhost:3000/components/ProductionOnboarding
   - Enter a test website URL
   - Progress through stages

3. **At Stage 3 (Connect Services)**
   - You'll see the AirbyteIntegrationHub
   - Shows 350+ available connectors
   - Recommendations based on business type
   - Test with demo credentials

### 3. Test Dynamic Schema Generation

```bash
# Test via API
curl -X POST http://localhost:3000/api/generate-schema \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test_tenant_123",
    "dataSources": [{
      "provider": "shopify",
      "sourceType": "shopify",
      "sourceId": "mock_source_id",
      "name": "My Shopify Store"
    }]
  }'
```

Expected response:
```json
{
  "success": true,
  "schema": "// Prisma schema content...",
  "models": [
    {
      "name": "Customer",
      "fields": 12,
      "relationships": ["Order", "Payment"]
    },
    {
      "name": "Order",
      "fields": 15,
      "relationships": ["Customer", "Product"]
    }
  ],
  "insights": {
    "businessLogic": ["E-commerce pattern detected"],
    "computedFields": ["lifetimeValue", "churnRisk"],
    "recommendations": ["Add inventory tracking", "Enable subscriptions"]
  }
}
```

### 4. Test Individual Components

#### OAuth Hub Service
```typescript
// Test file: packages/discovery/src/services/oauth-hub-service.test.ts
import { OAuthHubService } from './oauth-hub-service'

test('should store OAuth credentials securely', async () => {
  const service = new OAuthHubService()
  const result = await service.connectProvider(
    'tenant_123',
    'stripe',
    { client_id: 'test', client_secret: 'test' }
  )
  expect(result.success).toBe(true)
})
```

#### Airbyte Discovery Service
```typescript
// Test schema discovery
const discovery = new AirbyteDiscoveryService()
const schema = await discovery.discoverSchema({
  sourceType: 'postgres',
  connectionConfig: {
    host: 'localhost',
    database: 'testdb'
  }
})
expect(schema.streams).toHaveLength(5)
```

#### Schema Analyzer
```typescript
// Test data type mapping
import { DataTypeMapper } from '@opsai/schema-generator'

test('should map PostgreSQL types correctly', () => {
  expect(DataTypeMapper.mapToPrismaType('varchar', 'postgres')).toBe('String')
  expect(DataTypeMapper.mapToPrismaType('integer', 'postgres')).toBe('Int')
  expect(DataTypeMapper.mapToPrismaType('jsonb', 'postgres')).toBe('Json')
})
```

## Testing Scenarios

### Scenario 1: E-commerce Business
1. Enter Shopify store URL
2. Connect Shopify + Stripe + Google Analytics
3. Verify generated schema includes:
   - Customer model with Shopify + Stripe fields
   - Order model with proper relationships
   - Analytics tracking fields

### Scenario 2: SaaS Platform
1. Enter SaaS website URL
2. Connect PostgreSQL + Stripe + Intercom
3. Verify generated schema includes:
   - User model with subscription fields
   - Tenant isolation
   - Usage tracking

### Scenario 3: B2B Service
1. Enter B2B website URL  
2. Connect Salesforce + QuickBooks + Slack
3. Verify generated schema includes:
   - Company/Account models
   - Invoice/Payment tracking
   - Communication logs

## Mock Data Testing

For testing without real integrations:

```typescript
// Use mock Airbyte responses
const mockAirbyteResponse = {
  streams: [
    {
      name: 'customers',
      json_schema: {
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          total_spent: { type: 'number' }
        }
      }
    }
  ]
}
```

## Debugging Tips

1. **Check Supabase Logs**
   ```sql
   -- View recent tenant creations
   SELECT * FROM tenants ORDER BY created_at DESC LIMIT 10;
   
   -- Check integration status
   SELECT * FROM tenant_integrations WHERE tenant_id = 'your_tenant_id';
   
   -- View audit logs
   SELECT * FROM audit_logs WHERE action LIKE 'schema%' ORDER BY created_at DESC;
   ```

2. **Enable Debug Logging**
   ```typescript
   // In your .env
   LOG_LEVEL=debug
   
   // In code
   console.log('🔍 Debug:', { dataSources, generatedSchema })
   ```

3. **Test Individual Services**
   ```bash
   # Test schema generator package
   cd packages/schema-generator
   npm test
   
   # Test API endpoints
   cd apps/opsai-onboarding
   npm run test:api
   ```

## Common Issues

### "Airbyte connection failed"
- Check API key is valid
- Verify workspace ID is correct
- Ensure source has proper permissions

### "Schema generation failed"
- Check sample data is available
- Verify data source credentials
- Look for type mapping errors

### "Tenant not found"
- Ensure tenant was created in Stage 1
- Check Supabase connection
- Verify tenant_id is passed correctly

## Performance Testing

```bash
# Test with large datasets
curl -X POST http://localhost:3000/api/generate-schema \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "perf_test",
    "dataSources": [
      {
        "provider": "postgres",
        "data": "// 10,000 records"
      }
    ]
  }'
```

Expected performance:
- < 2s for schema analysis
- < 500ms for type inference
- < 5s total for complete generation

## Integration Testing

Full flow test script:
```bash
#!/bin/bash
# test-full-flow.sh

# 1. Create tenant
TENANT_ID=$(curl -X POST http://localhost:3000/api/tenants/create \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Company", "industry": "ecommerce"}' \
  | jq -r '.tenantId')

# 2. Connect Airbyte source
SOURCE_ID=$(curl -X POST http://localhost:3000/api/airbyte/sources/create \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\": \"$TENANT_ID\", \"sourceType\": \"stripe\", \"name\": \"Test Stripe\"}" \
  | jq -r '.sourceId')

# 3. Test connection
curl -X POST http://localhost:3000/api/airbyte/sources/test \
  -H "Content-Type: application/json" \
  -d "{\"sourceId\": \"$SOURCE_ID\"}"

# 4. Generate schema
curl -X POST http://localhost:3000/api/generate-schema \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\": \"$TENANT_ID\", \"dataSources\": [{\"sourceId\": \"$SOURCE_ID\"}]}"
```

## Next Steps

After testing:
1. Deploy to staging environment
2. Run load tests with multiple tenants
3. Verify data isolation
4. Test error recovery scenarios