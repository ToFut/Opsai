# Complete Airbyte Integration Guide

## Overview

This guide explains how to set up a complete data pipeline using Airbyte API:
1. Create Sources (where data comes from)
2. Create Destinations (where data goes)
3. Create Connections (link source to destination)
4. Trigger Syncs (move the data)

## Quick Start

### 1. Access the Setup Page

Visit: `http://localhost:7250/airbyte-setup`

### 2. Environment Variables Required

Make sure these are in your `.env.local`:
```bash
# Airbyte Cloud API
AIRBYTE_API_URL=https://api.airbyte.com/v1
AIRBYTE_API_KEY=your-api-key
AIRBYTE_WORKSPACE_ID=your-workspace-id

# OAuth Providers (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Step-by-Step Guide

### Step 1: Create a Source

Sources are where your data comes from (databases, APIs, etc.)

#### OAuth Sources (GitHub, Shopify, etc.)
1. Click on the source you want (e.g., GitHub)
2. You'll be redirected to authorize
3. After authorization, the source is created automatically

#### Direct Sources (PostgreSQL, MySQL, etc.)
1. Click on the database source
2. Source is created with default config
3. You'll need to update credentials in Airbyte UI

### Step 2: Create a Destination

Destinations are where your data will be stored.

Common destinations:
- **PostgreSQL** - Another database
- **BigQuery** - Google's data warehouse
- **Snowflake** - Cloud data warehouse
- **S3** - File storage

### Step 3: Create a Connection

1. Go to the "Connections" tab
2. Select your source and destination
3. Click "Create Connection"
4. This will:
   - Discover the source schema
   - Configure sync settings
   - Create the connection

### Step 4: Trigger a Sync

1. Go to the "Sync" tab
2. Find your connection
3. Click "Start Sync"
4. Monitor progress in Airbyte UI

## API Endpoints

### Main Flow Endpoint: `/api/airbyte/complete-flow`

Actions available:
- `list-sources` - Get available source types
- `list-destinations` - Get available destination types
- `create-source` - Create a new source
- `create-destination` - Create a new destination
- `create-connection` - Link source to destination
- `trigger-sync` - Start data sync
- `get-oauth-url` - Get OAuth authorization URL
- `complete-oauth` - Complete OAuth flow

### Example API Calls

#### Create a PostgreSQL Source
```javascript
fetch('/api/airbyte/complete-flow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create-source',
    sourceType: 'postgres',
    name: 'my-postgres-db',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'mydb',
      username: 'user',
      password: 'pass'
    }
  })
})
```

#### Create a BigQuery Destination
```javascript
fetch('/api/airbyte/complete-flow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create-destination',
    destinationType: 'bigquery',
    name: 'my-bigquery',
    config: {
      project_id: 'my-gcp-project',
      dataset_id: 'airbyte_sync',
      credentials_json: '{...}' // Service account JSON
    }
  })
})
```

## Source Configuration Examples

### GitHub (OAuth)
```javascript
{
  start_date: '2024-01-01',
  credentials: {
    option_title: 'OAuth Credentials',
    access_token: 'gho_xxxxx' // From OAuth flow
  },
  repositories: ['owner/repo1', 'owner/repo2']
}
```

### PostgreSQL (Direct)
```javascript
{
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'postgres',
  password: 'password',
  schemas: ['public'],
  ssl_mode: { mode: 'prefer' }
}
```

### Shopify (OAuth)
```javascript
{
  shop: 'myshop.myshopify.com',
  start_date: '2024-01-01',
  credentials: {
    auth_method: 'oauth2.0',
    access_token: 'shpat_xxxxx'
  }
}
```

## Destination Configuration Examples

### PostgreSQL
```javascript
{
  host: 'destination-host',
  port: 5432,
  database: 'destination_db',
  schema: 'public',
  username: 'postgres',
  password: 'password'
}
```

### S3
```javascript
{
  access_key_id: 'AKIAXXXXXX',
  secret_access_key: 'secret',
  s3_bucket_name: 'my-bucket',
  s3_bucket_path: 'airbyte/data',
  s3_bucket_region: 'us-east-1',
  format: {
    format_type: 'JSONL',
    compression: { compression_type: 'GZIP' }
  }
}
```

## Sync Configuration

When creating a connection, you can configure:

1. **Sync Mode**:
   - `full_refresh` - Replace all data
   - `incremental` - Only sync new/changed data

2. **Destination Sync Mode**:
   - `overwrite` - Replace existing data
   - `append` - Add to existing data
   - `append_dedup` - Add and deduplicate

3. **Schedule**:
   - Manual
   - Cron expression
   - Basic schedule (hourly, daily, etc.)

## Troubleshooting

### Safari Can't Open Page
- Make sure you're using `http://localhost:7250` (not 6060)
- Check if the dev server is running: `npm run dev`
- Clear Safari cache and cookies

### OAuth Errors
- Ensure OAuth credentials are in `.env.local`
- Check redirect URI matches exactly
- For GitHub: Redirect URI must be `http://localhost:7250/oauth-success`

### Connection Failed
- Verify source credentials are correct
- Check network connectivity
- Ensure Airbyte API token is valid

### Sync Failed
- Check source permissions
- Verify destination has enough space
- Look at Airbyte logs for details

## Complete Example Flow

```javascript
// 1. Create GitHub source (OAuth)
const sourceResponse = await fetch('/api/airbyte/complete-flow', {
  method: 'POST',
  body: JSON.stringify({
    action: 'get-oauth-url',
    sourceType: 'github'
  })
})
// User authorizes...

// 2. Create PostgreSQL destination
const destResponse = await fetch('/api/airbyte/complete-flow', {
  method: 'POST',
  body: JSON.stringify({
    action: 'create-destination',
    destinationType: 'postgres',
    config: { /* postgres config */ }
  })
})

// 3. Create connection
const connResponse = await fetch('/api/airbyte/complete-flow', {
  method: 'POST',
  body: JSON.stringify({
    action: 'create-connection',
    sourceId: 'source-id',
    destinationId: 'dest-id'
  })
})

// 4. Start sync
const syncResponse = await fetch('/api/airbyte/complete-flow', {
  method: 'POST',
  body: JSON.stringify({
    action: 'trigger-sync',
    connectionId: 'connection-id'
  })
})
```

## Next Steps

1. Visit `http://localhost:7250/airbyte-setup`
2. Create a source (try GitHub for OAuth flow)
3. Create a destination (try PostgreSQL)
4. Connect them and sync data
5. Monitor sync progress in Airbyte Cloud UI

The complete flow is now implemented and ready to use!