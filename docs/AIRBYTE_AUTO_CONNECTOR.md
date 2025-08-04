# Airbyte Auto-Connector Creation

This feature allows automatic creation of custom Airbyte connectors for any REST API through the OpsAI platform.

## Overview

The Auto-Connector system provides two approaches:

1. **Template-based Setup**: Quick setup for popular APIs (Shopify, Stripe, Salesforce, etc.)
2. **Custom API Setup**: Create connectors for any REST API with auto-discovery capabilities

## Features

### 🚀 Key Capabilities

- **API Auto-Discovery**: Automatically discover endpoints from OpenAPI/Swagger specifications
- **Authentication Support**: OAuth 2.0, API Key, Bearer Token, Basic Auth
- **YAML Manifest Generation**: Creates Low-Code CDK manifests compatible with Airbyte
- **Template Library**: Pre-configured templates for popular services
- **Visual UI**: Step-by-step wizard for connector configuration

### 📋 Supported Authentication Types

- **API Key**: Header or query parameter based
- **OAuth 2.0**: Full OAuth flow support with automatic token refresh
- **Bearer Token**: Simple bearer token authentication
- **Basic Auth**: Username/password authentication

## API Endpoints

### 1. Create Custom Connector

```http
POST /api/airbyte/connectors/auto-create
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "apiUrl": "https://api.example.com/v1",
  "apiName": "My Custom API",
  "authType": "api_key",
  "authConfig": {
    "apiKeyConfig": {
      "headerName": "X-API-Key",
      "location": "header"
    }
  },
  "endpoints": [
    {
      "name": "users",
      "path": "/users",
      "method": "GET",
      "paginated": true,
      "paginationType": "offset"
    }
  ],
  "openApiUrl": "https://api.example.com/openapi.json",
  "autoDiscover": true
}
```

**Response:**
```json
{
  "success": true,
  "connectorId": "custom_my_api_1234567890",
  "connector": {
    "id": "custom_my_api_1234567890",
    "name": "My Custom API",
    "apiUrl": "https://api.example.com/v1",
    "authType": "api_key",
    "endpoints": [...],
    "manifest": { /* YAML manifest object */ }
  },
  "message": "Successfully created custom connector",
  "nextSteps": [...]
}
```

### 2. Template-based Setup

```http
POST /api/airbyte/sources/auto-setup
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "sourceType": "shopify",
  "connectionName": "My Shopify Store",
  "credentials": {
    "shop_name": "mystore",
    "client_id": "xxx",
    "client_secret": "yyy"
  }
}
```

### 3. List Available Templates

```http
GET /api/airbyte/sources/auto-setup
```

## Usage Examples

### Example 1: Create Connector with Auto-Discovery

```javascript
// Auto-discover API from OpenAPI spec
const response = await fetch('/api/airbyte/connectors/auto-create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'my-tenant',
    apiUrl: 'https://api.stripe.com/v1',
    openApiUrl: 'https://api.stripe.com/openapi/spec3.json',
    autoDiscover: true
  })
})
```

### Example 2: Manual Connector Configuration

```javascript
// Manually configure API endpoints
const response = await fetch('/api/airbyte/connectors/auto-create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'my-tenant',
    apiUrl: 'https://api.myapp.com',
    apiName: 'My App API',
    authType: 'bearer',
    endpoints: [
      {
        name: 'customers',
        path: '/api/v1/customers',
        method: 'GET',
        paginated: true,
        paginationType: 'page',
        dataPath: 'data'
      },
      {
        name: 'orders',
        path: '/api/v1/orders',
        method: 'GET',
        paginated: true,
        paginationType: 'cursor',
        dataPath: 'results'
      }
    ]
  })
})
```

### Example 3: Use Template Connector

```javascript
// Quick setup for Stripe
const response = await fetch('/api/airbyte/sources/auto-setup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'my-tenant',
    sourceType: 'stripe',
    connectionName: 'Production Stripe',
    credentials: {
      api_key: 'sk_live_...'
    }
  })
})
```

## Frontend Component

The `AutoConnectorSetup` React component provides a wizard interface:

```jsx
import AutoConnectorSetup from '@/components/AutoConnectorSetup'

function MyPage() {
  return (
    <AutoConnectorSetup
      tenantId="my-tenant"
      onSuccess={(connector) => {
        console.log('Connector created:', connector)
      }}
      onCancel={() => {
        console.log('Setup cancelled')
      }}
    />
  )
}
```

## Generated YAML Manifest

The system generates Low-Code CDK manifests compatible with Airbyte:

```yaml
version: "0.50.2"
type: DeclarativeSource
check:
  type: CheckStream
  stream_names: ["users"]

definitions:
  base_requester:
    type: HttpRequester
    url_base: https://api.example.com/v1
    http_method: GET
    authenticator:
      $ref: "#/definitions/authenticator"
      
  authenticator:
    type: ApiKeyAuthenticator
    api_token: "{{ config['api_key'] }}"
    header: X-API-Key
    
  paginator:
    type: DefaultPaginator
    page_token_option:
      type: RequestOption
      inject_into: request_parameter
      field_name: offset
    pagination_strategy:
      type: OffsetIncrement
      page_size: 100

streams:
  - type: DeclarativeStream
    name: users
    primary_key: ["id"]
    retriever:
      type: SimpleRetriever
      requester:
        $ref: "#/definitions/base_requester"
        path: /users
      record_selector:
        type: RecordSelector
        extractor:
          type: DpathExtractor
          field_path: ["data"]
      paginator:
        $ref: "#/definitions/paginator"

spec:
  type: Spec
  connection_specification:
    $schema: http://json-schema.org/draft-07/schema#
    title: Example API Source Spec
    type: object
    required: ["api_key"]
    properties:
      api_key:
        type: string
        title: API Key
        description: API Key for authentication
        airbyte_secret: true
```

## Setup Requirements

### For Airbyte Cloud

1. Sign up at https://cloud.airbyte.com
2. Get API credentials from Settings → API Keys
3. Set environment variables:
   ```env
   AIRBYTE_API_KEY=your_api_key
   AIRBYTE_WORKSPACE_ID=your_workspace_id
   ```

### For Self-Managed Airbyte

1. Deploy Airbyte using Docker or Kubernetes
2. Access the API at your deployment URL
3. Configure API endpoint:
   ```env
   AIRBYTE_API_URL=https://your-airbyte.com/api/v1
   AIRBYTE_API_KEY=your_api_key
   ```

## Limitations

- **Airbyte Cloud**: Custom connector creation via API is limited. Manifests need to be uploaded through UI
- **OAuth Setup**: Requires manual configuration in provider dashboards
- **Complex APIs**: Some APIs may require manual manifest adjustments

## Testing

Run the test script to verify functionality:

```bash
cd apps/opsai-onboarding
node test-auto-connector.js
```

This will:
1. List available template connectors
2. Test template-based setup
3. Test custom API connector creation
4. Generate sample YAML manifests

## Best Practices

1. **Use Auto-Discovery**: When available, use OpenAPI/Swagger URLs for accurate endpoint discovery
2. **Test Authentication**: Verify API credentials before creating connectors
3. **Start Simple**: Begin with a few endpoints and expand later
4. **Monitor Rate Limits**: Configure appropriate rate limiting for APIs
5. **Review Generated Manifests**: Check and adjust YAML manifests as needed

## Troubleshooting

### Common Issues

1. **"Airbyte not configured"**
   - Set AIRBYTE_API_KEY and AIRBYTE_WORKSPACE_ID environment variables
   
2. **"Failed to discover API"**
   - Verify the API URL is accessible
   - Check if OpenAPI spec URL is correct
   - Some APIs may not have public OpenAPI documentation

3. **"OAuth required"**
   - Complete OAuth setup in provider dashboard
   - Use the OAuth flow endpoint: `/api/oauth/create-url`

4. **"Manifest creation failed"**
   - For Airbyte Cloud, upload manifests manually through UI
   - Use Terraform for programmatic deployment in self-managed instances

## Future Enhancements

- GraphQL API support
- Webhook connector generation
- Advanced pagination strategies
- Schema inference from sample data
- Automatic OAuth app creation
- Connector marketplace integration