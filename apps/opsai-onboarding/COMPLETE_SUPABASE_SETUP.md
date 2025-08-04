# 🚀 Complete Supabase Setup (5 minutes)

Your OAuth flow is working perfectly with temp storage! Here's how to make it work with Supabase:

## Step 1: Create Tables (2 minutes)

1. **Open Supabase Dashboard**: https://supabase.com/dashboard/project/dqmufpexuuvlulpilirt/editor

2. **Click "SQL Editor"** (left sidebar)

3. **Click "New Query"**

4. **Copy & paste this SQL**:
```sql
CREATE TABLE tenant_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255), 
  provider VARCHAR(100), 
  access_token TEXT, 
  connected_at TIMESTAMPTZ DEFAULT NOW(), 
  status VARCHAR(50) DEFAULT 'connected'
);

CREATE TABLE tenant_sample_data (
  id SERIAL PRIMARY KEY, 
  tenant_id VARCHAR(255), 
  provider VARCHAR(100), 
  sample_data JSONB, 
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_data_schemas (
  id SERIAL PRIMARY KEY, 
  tenant_id VARCHAR(255), 
  providers TEXT[], 
  entities JSONB, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_dynamic_data (
  id SERIAL PRIMARY KEY, 
  tenant_id VARCHAR(255), 
  entity_type VARCHAR(255), 
  entity_id VARCHAR(255), 
  data JSONB, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

5. **Click "RUN"** button

## Step 2: Migrate Existing Data (1 minute)

Run this command to move your existing temp data to Supabase:

```bash 
curl -X POST http://localhost:7250/api/migrate-temp-data -H "Content-Type: application/json" -d '{"tenantId":"default"}'
```

## Step 3: Test the Flow (2 minutes)

1. Go to http://localhost:7250/onboarding-v3
2. Connect providers (GitHub, Google, etc.)  
3. Click "Next" to organize database
4. **Data will now save to Supabase!** ✅

## 🔍 Verify Your Data in Supabase

After running the flow, check your Supabase dashboard:

```sql
-- See connected providers
SELECT * FROM tenant_integrations WHERE tenant_id = 'default';

-- See sample data
SELECT provider, collected_at FROM tenant_sample_data WHERE tenant_id = 'default';

-- See generated schema  
SELECT providers, entities FROM tenant_data_schemas WHERE tenant_id = 'default';

-- See organized data
SELECT entity_type, COUNT(*) FROM tenant_dynamic_data WHERE tenant_id = 'default' GROUP BY entity_type;
```

## ✅ What You Get

After setup, every OAuth connection will:
- ✅ Store tokens in `tenant_integrations`
- ✅ Collect sample data into `tenant_sample_data`  
- ✅ Generate AI schema in `tenant_data_schemas`
- ✅ Organize data in `tenant_dynamic_data`

**Your complete OAuth → Sample Data → DB Organization flow will be running on Supabase!**