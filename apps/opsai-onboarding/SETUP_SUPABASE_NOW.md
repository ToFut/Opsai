# 🚀 Setup Supabase Tables - Complete in 2 Minutes

Your OAuth flow is working perfectly! The data is being stored in temp files. To get it saving to Supabase, just create the database tables:

## Step 1: Go to Supabase Dashboard
**Click this link:** https://supabase.com/dashboard/project/dqmufpexuuvlulpilirt/editor

## Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**

## Step 3: Copy & Paste This SQL
```sql
-- Create tenant_integrations table
CREATE TABLE IF NOT EXISTS tenant_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  token_type VARCHAR(50),
  raw_response JSONB,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'connected',
  airbyte_source_id VARCHAR(255),
  UNIQUE(tenant_id, provider)
);

-- Create tenant_sample_data table
CREATE TABLE IF NOT EXISTS tenant_sample_data (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  sample_data JSONB NOT NULL,
  data_analysis JSONB,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, provider)
);

-- Create tenant_data_schemas table
CREATE TABLE IF NOT EXISTS tenant_data_schemas (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  providers TEXT[] NOT NULL,
  entities JSONB NOT NULL,
  relationships JSONB,
  indexes JSONB,
  views JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tenant_dynamic_data table
CREATE TABLE IF NOT EXISTS tenant_dynamic_data (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  entity_type VARCHAR(255) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, entity_type, entity_id)
);

-- Create tenant_airbyte_connections table
CREATE TABLE IF NOT EXISTS tenant_airbyte_connections (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  source_id VARCHAR(255),
  destination_id VARCHAR(255),
  connection_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, provider)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_integrations_tenant ON tenant_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sample_data_tenant ON tenant_sample_data(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schemas_tenant ON tenant_data_schemas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_data_tenant ON tenant_dynamic_data(tenant_id, entity_type);
```

## Step 4: Run the SQL
Click the **"RUN"** button (or press Ctrl+Enter)

## Step 5: Test the Flow Again
1. Go back to http://localhost:7250/onboarding-v3
2. Connect providers (GitHub, Google, etc.)
3. Click "Next" to organize database
4. **Now it will save to Supabase instead of temp files!**

## ✅ What Will Happen After Setup:
- OAuth tokens → `tenant_integrations` table
- Sample data → `tenant_sample_data` table  
- AI-generated schema → `tenant_data_schemas` table
- Organized data → `tenant_dynamic_data` table

## 🔍 Check Your Data:
After running the flow, you can query your data:
```sql
-- See connected providers
SELECT * FROM tenant_integrations WHERE tenant_id = 'default';

-- See sample data collected
SELECT provider, collected_at FROM tenant_sample_data WHERE tenant_id = 'default';

-- See AI-generated schema
SELECT providers, entities FROM tenant_data_schemas WHERE tenant_id = 'default';

-- See organized data
SELECT entity_type, COUNT(*) as count FROM tenant_dynamic_data WHERE tenant_id = 'default' GROUP BY entity_type;
```

---

**Your flow is already working perfectly - this just switches from temp files to Supabase!**