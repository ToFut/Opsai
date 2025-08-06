# OpsAI Integration Service

Complete OAuth + Airbyte + Terraform integration service for OpsAI platform.

## 🚀 Features

- **OAuth Authentication** for NetSuite, QuickBooks, Shopify, Google Analytics, Stripe
- **Automatic Airbyte Connection Creation** via API
- **Terraform Infrastructure Management** per user
- **Data Sync to Supabase** with user-specific schemas
- **React UI Components** for integration management
- **Analytics Dashboard** with cross-platform data

## 📋 Prerequisites

1. **Airbyte Cloud Account** or self-hosted Airbyte instance
2. **Supabase Project** with database access
3. **Terraform** installed locally
4. **OAuth Apps** registered for each provider
5. **Node.js 18+** and pnpm

## 🔧 Setup Instructions

### 1. Environment Variables

Create `.env` file in the integrations package:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_DB_PASSWORD=your-db-password

# Airbyte
AIRBYTE_API_URL=https://api.airbyte.com/v1
AIRBYTE_API_KEY=your-airbyte-api-key
AIRBYTE_WORKSPACE_ID=your-workspace-id

# OAuth - QuickBooks
QUICKBOOKS_CLIENT_ID=your-client-id
QUICKBOOKS_CLIENT_SECRET=your-client-secret

# OAuth - NetSuite
NETSUITE_CLIENT_ID=your-client-id
NETSUITE_CLIENT_SECRET=your-client-secret

# OAuth - Shopify
SHOPIFY_CLIENT_ID=your-client-id
SHOPIFY_CLIENT_SECRET=your-client-secret

# OAuth - Google
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# App
APP_URL=http://localhost:3000
INTEGRATION_PORT=3005
NODE_ENV=development
LOG_LEVEL=info
```

### 2. Database Setup

Run the schema creation script:

```bash
# Apply to Supabase
psql $SUPABASE_DB_URL < database/schema.sql

# Or use Supabase dashboard SQL editor
```

### 3. Install Dependencies

```bash
cd packages/integrations
pnpm install
```

### 4. Configure OAuth Apps

#### QuickBooks
1. Go to https://developer.intuit.com
2. Create an app
3. Add redirect URI: `http://localhost:3000/api/oauth/callback`
4. Copy Client ID and Secret to `.env`

#### NetSuite
1. Go to NetSuite > Setup > Integration > Manage Integrations
2. Create new integration
3. Enable OAuth 2.0
4. Add redirect URI: `http://localhost:3000/api/oauth/callback`
5. Copy credentials to `.env`

#### Shopify
1. Go to https://partners.shopify.com
2. Create an app
3. Add redirect URI: `http://localhost:3000/api/oauth/callback`
4. Copy API credentials to `.env`

#### Google Analytics
1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:3000/api/oauth/callback`
4. Enable Google Analytics API
5. Copy credentials to `.env`

### 5. Start the Service

```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

## 🎯 Usage

### 1. Connect a Provider (Frontend)

```tsx
import { IntegrationManager } from '@opsai/integrations';

function App() {
  const userId = 'user-123';
  
  return (
    <IntegrationManager userId={userId} />
  );
}
```

### 2. Connect via API

```javascript
// Initiate OAuth
const response = await fetch('/api/oauth/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-123',
    provider: 'quickbooks'
  })
});

const { authUrl } = await response.json();
window.location.href = authUrl;

// For API key providers (Stripe)
await fetch('/api/oauth/connect-api-key', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-123',
    provider: 'stripe',
    apiKey: 'sk_live_...'
  })
});
```

### 3. Trigger Data Sync

```javascript
// Manual sync
await fetch('/api/connections/user-123/quickbooks/sync', {
  method: 'POST'
});

// Get sync status
const status = await fetch('/api/data-sync/user-123/status');
const data = await status.json();
```

### 4. Access Synced Data

```javascript
// Get provider data
const response = await fetch('/api/data-sync/user-123/stripe/data');
const { data } = await response.json();

// Get analytics
const analytics = await fetch('/api/data-sync/user-123/analytics');
const { revenue, customers } = await analytics.json();
```

## 📊 Data Flow

```
1. User clicks "Connect Provider"
   ↓
2. OAuth flow initiated
   ↓
3. Tokens stored in Supabase
   ↓
4. Terraform creates Airbyte resources
   ↓
5. Airbyte connection established
   ↓
6. Data syncs to user schema in Supabase
   ↓
7. Analytics available via API
```

## 🗄️ Database Schema

Each user gets their own schema: `user_${userId}`

### Tables per Provider

**Stripe:**
- stripe_customers
- stripe_charges
- stripe_invoices
- stripe_subscriptions

**QuickBooks:**
- quickbooks_customers
- quickbooks_invoices
- quickbooks_items
- quickbooks_payments

**Shopify:**
- shopify_customers
- shopify_orders
- shopify_products
- shopify_line_items

**Google Analytics:**
- ga_website_overview
- ga_traffic_sources
- ga_page_views

## 🔍 Troubleshooting

### OAuth Issues
```bash
# Check OAuth state
curl http://localhost:3005/api/oauth/status/user-123

# Refresh tokens
curl -X POST http://localhost:3005/api/oauth/refresh/user-123/quickbooks
```

### Terraform Issues
```bash
# Check Terraform state
cd terraform/users/user-123
terraform state list

# Force refresh
terraform refresh

# Destroy and recreate
terraform destroy -auto-approve
terraform apply -auto-approve
```

### Airbyte Issues
```bash
# Check connection status
curl http://localhost:3005/api/connections/user-123

# Trigger manual sync
curl -X POST http://localhost:3005/api/connections/user-123/stripe/sync

# Check sync logs
curl http://localhost:3005/api/connections/user-123/stripe/status
```

## 🚀 Production Deployment

### 1. Use Terraform Cloud
```hcl
# backend.tf
terraform {
  cloud {
    organization = "your-org"
    workspaces {
      prefix = "opsai-"
    }
  }
}
```

### 2. Use Managed Airbyte
- Airbyte Cloud for reliability
- Or deploy Airbyte on Kubernetes

### 3. Secure Credentials
- Use AWS Secrets Manager or similar
- Rotate OAuth tokens regularly
- Implement token encryption

### 4. Scale Considerations
- Use Redis for OAuth state management
- Implement connection pooling
- Add rate limiting
- Use queue for Terraform operations

## 📝 API Reference

### OAuth Endpoints
- `POST /api/oauth/initiate` - Start OAuth flow
- `GET /api/oauth/callback` - OAuth callback handler
- `POST /api/oauth/connect-api-key` - API key connection
- `GET /api/oauth/status/:userId` - Connection status
- `POST /api/oauth/refresh/:userId/:provider` - Refresh tokens

### Connection Endpoints
- `GET /api/connections/:userId` - List connections
- `POST /api/connections/:userId/:provider/sync` - Trigger sync
- `DELETE /api/connections/:userId/:provider` - Delete connection
- `GET /api/connections/:userId/:provider/status` - Detailed status

### Data Sync Endpoints
- `GET /api/data-sync/:userId/status` - Sync status
- `GET /api/data-sync/:userId/:provider/data` - Get data
- `GET /api/data-sync/:userId/analytics` - Analytics
- `POST /api/data-sync/:userId/refresh` - Refresh all

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT