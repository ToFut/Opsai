# OAuth → Sample Data → Organized DB Flow

## ✅ What's Now Implemented

### 1. **OAuth Connection**
When user connects a service (e.g., GitHub):
- OAuth flow completes
- Token is stored in Supabase

### 2. **Sample Data Collection**
Immediately after OAuth:
```javascript
// Automatically fetches sample data
POST /api/providers/sample-data
{
  provider: "github",
  accessToken: "gho_xxx",
  tenantId: "default"
}

// Returns:
{
  sampleData: {
    entities: {
      repositories: { sample: [...], schema: {...} },
      issues: { sample: [...], schema: {...} }
    },
    metrics: {
      totalStars: 1337,
      openIssues: 23
    }
  },
  analysis: {
    dataQuality: { completeness: 95% },
    businessModel: "software-development"
  }
}
```

### 3. **Data Storage Per Tenant**
Sample data is stored in `tenant_sample_data` table:
```sql
{
  tenant_id: "default",
  provider: "github",
  sample_data: { /* all the sample data */ },
  data_analysis: { /* AI analysis results */ }
}
```

### 4. **Database Organization**
When user clicks "Next" after integrations:
```javascript
// Triggered automatically
POST /api/organize-database
{
  tenantId: "default"
}

// AI analyzes all connected providers together
// Generates optimal schema
// Stores organized data in tenant_dynamic_data
```

## 🧪 Testing the Complete Flow

### Step 1: Start the app
```bash
cd /Users/segevbin/Desktop/Opsai/apps/opsai-onboarding
npm run dev
```

### Step 2: Run migrations
```bash
# Create the new tables
psql $DATABASE_URL < supabase/migrations/20240104_tenant_sample_data.sql
```

### Step 3: Test the flow
1. Go to http://localhost:7250/onboarding-v3
2. Complete AI Analysis step
3. Connect GitHub (or any provider)
4. Watch console for:
   - "📊 Fetching sample data for github"
   - "✅ Collected sample data"
5. Click Next to go to Workflows
6. Watch console for:
   - "🗄️ Organizing database with collected sample data"
   - "✅ Database organized"

### Step 4: Verify data in Supabase
```sql
-- Check sample data
SELECT * FROM tenant_sample_data WHERE tenant_id = 'default';

-- Check organized schema
SELECT * FROM tenant_data_schemas WHERE tenant_id = 'default';

-- Check organized data
SELECT * FROM tenant_dynamic_data WHERE tenant_id = 'default';
```

## 📊 What the Data Looks Like

### Sample Data (tenant_sample_data)
```json
{
  "provider": "github",
  "sample_data": {
    "entities": {
      "repositories": {
        "sample": [
          { "id": 1, "name": "my-app", "stars": 42 }
        ],
        "schema": {
          "id": "number",
          "name": "string",
          "stars": "number"
        }
      }
    },
    "metrics": {
      "totalStars": 1337
    }
  }
}
```

### Generated Schema (tenant_data_schemas)
```json
{
  "entities": {
    "unified_customers": {
      "fields": {
        "id": { "type": "UUID", "primary": true },
        "email": { "type": "VARCHAR(255)", "unique": true },
        "stripe_id": { "type": "VARCHAR(255)" },
        "github_username": { "type": "VARCHAR(255)" }
      }
    }
  },
  "relationships": [
    {
      "from": "orders",
      "to": "unified_customers",
      "field": "customer_id"
    }
  ]
}
```

### Organized Data (tenant_dynamic_data)
```json
{
  "tenant_id": "default",
  "entity_type": "github_repositories",
  "entity_id": "123456",
  "data": {
    "id": 123456,
    "name": "my-app",
    "full_name": "user/my-app",
    "stars": 42
  }
}
```

## 🎯 Next Steps

1. **Workflow Generation** - Use the organized data to suggest workflows
2. **Dashboard Generation** - Create UI based on available entities
3. **Continuous Sync** - Setup Airbyte for ongoing updates
4. **Multi-tenant Isolation** - Ensure data separation

## 🔧 Troubleshooting

### If OpenAI fails:
```bash
# Check your API key
echo $OPENAI_API_KEY
```

### If database tables don't exist:
```bash
# Run migrations manually
psql $DATABASE_URL < supabase/migrations/20240104_tenant_sample_data.sql
```

### If sample data fetch fails:
- Check OAuth token is valid
- Verify provider API is accessible
- Check rate limits