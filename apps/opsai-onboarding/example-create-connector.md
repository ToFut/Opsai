# How to Create an Airbyte Connector

## Prerequisites

1. **Set up Airbyte credentials** in your `.env.local` file:
```env
AIRBYTE_API_KEY=your_airbyte_api_key
AIRBYTE_WORKSPACE_ID=your_workspace_id
AIRBYTE_API_URL=https://api.airbyte.com/v1  # or your self-hosted URL
```

2. **For OAuth-based connectors**, also add:
```env
# Example for Shopify
SHOPIFY_CLIENT_ID=your_shopify_client_id
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret

# Example for Salesforce
SALESFORCE_CLIENT_ID=your_salesforce_client_id
SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret
```

## Method 1: Using the UI Component

Add the `AutoConnectorSetup` component to your page:

```jsx
import AutoConnectorSetup from '@/components/AutoConnectorSetup'

export default function IntegrationsPage() {
  return (
    <AutoConnectorSetup
      tenantId="your-tenant-id"
      onSuccess={(connector) => {
        console.log('Connector created:', connector)
        // Redirect or show success message
      }}
      onCancel={() => {
        // Handle cancellation
      }}
    />
  )
}
```

## Method 2: Using Template Connectors (Quick Setup)

For popular APIs like Stripe, Shopify, Salesforce:

```javascript
// Example: Create a Stripe connector
const response = await fetch('/api/airbyte/sources/auto-setup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'your-tenant-id',
    sourceType: 'stripe',
    connectionName: 'My Stripe Production',
    credentials: {
      api_key: 'sk_live_...',  // Your Stripe API key
      account_id: 'acct_...'   // Your Stripe account ID
    }
  })
})

const result = await response.json()
console.log('Stripe connector created:', result)
```

## Method 3: Custom API Connector with Auto-Discovery

For any REST API with OpenAPI documentation:

```javascript
// Example: Create connector for a custom API
const response = await fetch('/api/airbyte/connectors/auto-create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'your-tenant-id',
    apiUrl: 'https://api.example.com/v1',
    apiName: 'My Custom API',
    openApiUrl: 'https://api.example.com/swagger.json',
    autoDiscover: true  // Auto-discover endpoints from OpenAPI
  })
})

const result = await response.json()
console.log('Custom connector created:', result)

// The response includes a YAML manifest that can be:
// 1. Automatically registered (Airbyte OSS)
// 2. Downloaded and uploaded via UI (Airbyte Cloud)
```

## Method 4: Manual API Configuration

For APIs without OpenAPI documentation:

```javascript
const response = await fetch('/api/airbyte/connectors/auto-create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'your-tenant-id',
    apiUrl: 'https://api.myapp.com',
    apiName: 'My App API',
    authType: 'api_key',
    authConfig: {
      apiKeyConfig: {
        headerName: 'X-API-Key',
        location: 'header'
      }
    },
    endpoints: [
      {
        name: 'customers',
        path: '/api/v1/customers',
        method: 'GET',
        paginated: true,
        paginationType: 'offset',
        dataPath: 'data'
      },
      {
        name: 'orders',
        path: '/api/v1/orders',
        method: 'GET',
        paginated: true,
        paginationType: 'page',
        dataPath: 'results'
      }
    ]
  })
})
```

## Available Template Connectors

| Service | Type | Authentication |
|---------|------|---------------|
| Shopify | E-commerce | OAuth 2.0 |
| WooCommerce | E-commerce | API Key |
| Stripe | Payments | API Key |
| Square | Payments | OAuth 2.0 |
| Salesforce | CRM | OAuth 2.0 |
| HubSpot | CRM | OAuth 2.0 |
| Mailchimp | Marketing | OAuth 2.0 |
| Google Analytics | Analytics | OAuth 2.0 |
| Slack | Communication | OAuth 2.0 |

## Next Steps After Creating a Connector

1. **Test the connection**:
```javascript
const testResponse = await fetch('/api/airbyte/sources/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceId: result.source.sourceId
  })
})
```

2. **Create a destination** (where data will be synced)
3. **Set up a connection** between source and destination
4. **Configure sync schedule** (manual, hourly, daily, etc.)
5. **Select streams/tables** to sync

## For Airbyte Cloud Users

Since Airbyte Cloud has limitations on programmatic custom connector creation:

1. The system generates a YAML manifest file
2. Download the manifest from the API response
3. Go to Airbyte Cloud UI → Settings → Sources → Upload Custom Connector
4. Upload the YAML manifest
5. The connector will be available in your workspace

## Example: Complete Flow

```javascript
// 1. Create connector
const connectorResponse = await fetch('/api/airbyte/connectors/auto-create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'my-tenant',
    apiUrl: 'https://jsonplaceholder.typicode.com',
    apiName: 'JSONPlaceholder',
    authType: 'api_key',
    authConfig: {
      apiKeyConfig: {
        headerName: 'X-API-Key',
        location: 'header'
      }
    },
    endpoints: [
      { name: 'posts', path: '/posts', method: 'GET' },
      { name: 'users', path: '/users', method: 'GET' },
      { name: 'comments', path: '/comments', method: 'GET' }
    ]
  })
})

const connector = await connectorResponse.json()

// 2. Save the manifest (for Airbyte Cloud)
if (connector.connector.manifest) {
  const yaml = require('js-yaml')
  const manifestYaml = yaml.dump(connector.connector.manifest)
  
  // Option A: Download as file
  const blob = new Blob([manifestYaml], { type: 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${connector.connector.name}-manifest.yaml`
  a.click()
  
  // Option B: Display for copying
  console.log('Connector Manifest:')
  console.log(manifestYaml)
}

// 3. For Airbyte OSS - Create source instance
if (connector.success) {
  const sourceResponse = await fetch('/api/airbyte/sources/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId: 'my-tenant',
      sourceType: connector.connectorId,
      name: 'My JSONPlaceholder Source',
      config: {
        api_key: 'my-actual-api-key'
      }
    })
  })
  
  const source = await sourceResponse.json()
  console.log('Source created:', source)
}
```

## Troubleshooting

1. **"Airbyte not configured"**: Set the required environment variables
2. **"OAuth required"**: Set up OAuth app in provider's developer console
3. **"Failed to create connector"**: Check API URL accessibility and credentials
4. **"Manifest creation failed"**: For Airbyte Cloud, use manual upload method

## Support

- Airbyte Documentation: https://docs.airbyte.com
- Connector Builder Guide: https://docs.airbyte.com/connector-development/connector-builder-ui
- Low-Code CDK Reference: https://docs.airbyte.com/connector-development/config-based/low-code-cdk-overview