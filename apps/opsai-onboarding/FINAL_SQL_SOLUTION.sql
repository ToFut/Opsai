-- ⚡ FINAL SQL TO COPY/PASTE INTO SUPABASE
-- This will fix the "Using temp storage" issue

-- 1. OAUTH & SAMPLE DATA TABLES
CREATE TABLE tenant_integrations (
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

CREATE TABLE tenant_sample_data (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  sample_data JSONB NOT NULL,
  data_analysis JSONB,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, provider)
);

CREATE TABLE tenant_data_schemas (
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

CREATE TABLE tenant_dynamic_data (
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

CREATE TABLE tenant_airbyte_connections (
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

-- 2. INDEXES FOR PERFORMANCE
CREATE INDEX idx_tenant_integrations_tenant ON tenant_integrations(tenant_id);
CREATE INDEX idx_sample_data_tenant ON tenant_sample_data(tenant_id);
CREATE INDEX idx_schemas_tenant ON tenant_data_schemas(tenant_id);
CREATE INDEX idx_dynamic_data_tenant ON tenant_dynamic_data(tenant_id, entity_type);
CREATE INDEX idx_airbyte_connections_tenant ON tenant_airbyte_connections(tenant_id);

-- 3. DISABLE RLS (Row Level Security) FOR THESE TABLES
ALTER TABLE tenant_integrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_sample_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_data_schemas DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_dynamic_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_airbyte_connections DISABLE ROW LEVEL SECURITY;