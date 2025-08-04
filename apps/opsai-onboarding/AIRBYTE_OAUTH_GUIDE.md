# Airbyte OAuth Implementation for Multi-Tenant SaaS

## Overview
This guide explains how to properly implement Airbyte OAuth for your end users in a multi-tenant environment.

## Current Implementation
- Users authenticate via YOUR OAuth apps (Google, Stripe, etc.)
- Access tokens are stored in Supabase `tenant_integrations` table
- Airbyte sources are created programmatically via API

## Production Architecture

### Option 1: Centralized OAuth (Recommended)
Your platform acts as the OAuth broker:

```
1. User clicks "Connect Stripe"
2. Your app initiates OAuth with YOUR Stripe app
3. User authorizes YOUR app to access their Stripe
4. You receive access token
5. You create Airbyte source using that token
6. Data syncs to user's isolated schema
```

**Pros:**
- Single OAuth app to manage
- Users trust your brand
- Easier compliance and security
- Better user experience

**Cons:**
- You handle all OAuth tokens
- Your API limits apply to all users

### Option 2: User's Own OAuth Apps
Each user registers their own OAuth apps:

```
1. User creates their own Google OAuth app
2. User provides client ID/secret to your platform
3. Your platform uses their credentials for OAuth
4. Each user has separate API quotas
```

**Pros:**
- Users control their own data access
- Separate API quotas per user
- No shared rate limits

**Cons:**
- Complex user onboarding
- Technical users only
- Support nightmare

## Implementation Details

### 1. Multi-Tenant Airbyte Sources

```javascript
// Create source per tenant per integration
const sourceName = `${tenantId}_${provider}_${timestamp}`;
const source = await airbyte.createSource({
  name: sourceName,
  workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
  sourceDefinitionId: getSourceDefinitionId(provider),
  connectionConfiguration: {
    ...getProviderConfig(provider),
    credentials: userAccessToken
  }
});
```

### 2. Isolated Destinations

Each tenant gets their own schema in Supabase:

```javascript
// Create destination with tenant-specific schema
const destination = await airbyte.createDestination({
  name: `${tenantId}_supabase`,
  destinationDefinitionId: SUPABASE_DESTINATION_ID,
  connectionConfiguration: {
    host: process.env.SUPABASE_HOST,
    database: process.env.SUPABASE_DB,
    schema: `tenant_${tenantId}`, // Isolated schema
    username: process.env.SUPABASE_USER,
    password: process.env.SUPABASE_PASSWORD
  }
});
```

### 3. Secure Token Storage

```sql
-- Encrypted token storage
CREATE TABLE tenant_integrations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  expires_at TIMESTAMP,
  airbyte_source_id UUID,
  airbyte_connection_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. OAuth Token Refresh

```javascript
// Automatic token refresh before sync
async function refreshTokenIfNeeded(tenantId, provider) {
  const integration = await getIntegration(tenantId, provider);
  
  if (isTokenExpired(integration)) {
    const newTokens = await refreshOAuthToken(provider, integration.refresh_token);
    await updateIntegrationTokens(tenantId, provider, newTokens);
    
    // Update Airbyte source with new token
    await airbyte.updateSource(integration.airbyte_source_id, {
      connectionConfiguration: {
        ...existingConfig,
        credentials: newTokens.access_token
      }
    });
  }
}
```

## Best Practices

### 1. Security
- Encrypt tokens at rest
- Use row-level security in Supabase
- Audit all data access
- Implement token rotation

### 2. Scalability
- One Airbyte workspace for all tenants
- Separate sources/destinations per tenant
- Monitor sync performance
- Implement usage quotas

### 3. Error Handling
- Graceful OAuth failure handling
- Retry failed syncs
- Alert users of sync issues
- Provide sync logs

### 4. User Experience
- Clear authorization flow
- Show sync status in UI
- Preview data before sync
- Allow manual sync triggers

## Example Implementation

### Frontend Component
```tsx
function IntegrationConnect({ provider, tenantId }) {
  const connectIntegration = async () => {
    // 1. OAuth flow
    const { authUrl } = await fetch('/api/oauth/connect', {
      method: 'POST',
      body: JSON.stringify({ provider, tenantId })
    });
    
    // 2. Open OAuth popup
    const popup = window.open(authUrl);
    
    // 3. Wait for completion
    window.addEventListener('message', async (event) => {
      if (event.data.type === 'oauth_complete') {
        // 4. Create Airbyte source
        await fetch('/api/airbyte/sources', {
          method: 'POST',
          body: JSON.stringify({
            provider,
            tenantId,
            accessToken: event.data.accessToken
          })
        });
      }
    });
  };
}
```

### Backend API
```javascript
// POST /api/airbyte/sources
export async function POST(req) {
  const { provider, tenantId, accessToken } = await req.json();
  
  // 1. Create Airbyte source
  const source = await airbyte.createSource({
    name: `tenant_${tenantId}_${provider}`,
    sourceDefinitionId: getSourceDefinitionId(provider),
    workspaceId: WORKSPACE_ID,
    connectionConfiguration: getSourceConfig(provider, accessToken)
  });
  
  // 2. Get or create destination
  const destination = await getOrCreateTenantDestination(tenantId);
  
  // 3. Create connection
  const connection = await airbyte.createConnection({
    sourceId: source.sourceId,
    destinationId: destination.destinationId,
    scheduleType: 'manual',
    namespaceDefinition: 'customformat',
    namespaceFormat: `tenant_${tenantId}_${provider}`,
    prefix: '',
    syncCatalog: await discoverSourceSchema(source.sourceId)
  });
  
  // 4. Store in database
  await saveTenantIntegration({
    tenantId,
    provider,
    airbyteSourceId: source.sourceId,
    airbyteConnectionId: connection.connectionId,
    accessToken: encrypt(accessToken)
  });
  
  // 5. Trigger initial sync
  await airbyte.triggerSync(connection.connectionId);
  
  return { success: true };
}
```

## Terraform Configuration

```hcl
# One workspace, multiple sources/destinations
resource "airbyte_workspace" "main" {
  name = "production"
}

# Dynamic source creation per tenant
resource "airbyte_source" "tenant_source" {
  for_each = var.tenant_integrations
  
  name         = "${each.value.tenant_id}_${each.value.provider}"
  workspace_id = airbyte_workspace.main.id
  
  definition_id = var.source_definitions[each.value.provider]
  
  configuration = {
    # Provider-specific config
  }
}
```

## Next Steps

1. **Implement token encryption**
2. **Add webhook handlers for OAuth callbacks**
3. **Create sync monitoring dashboard**
4. **Implement usage quotas**
5. **Add data preview before sync**