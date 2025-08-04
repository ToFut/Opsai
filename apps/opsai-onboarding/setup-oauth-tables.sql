-- Create tables for OAuth sample data flow

-- 1. Tenant integrations (OAuth tokens)
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

-- 2. Sample data storage
CREATE TABLE IF NOT EXISTS tenant_sample_data (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  sample_data JSONB NOT NULL,
  data_analysis JSONB,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, provider)
);

-- 3. Data schemas
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

-- 4. Dynamic data storage
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

-- 5. Airbyte connections (optional)
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
CREATE INDEX idx_tenant_integrations_tenant ON tenant_integrations(tenant_id);
CREATE INDEX idx_sample_data_tenant ON tenant_sample_data(tenant_id);
CREATE INDEX idx_schemas_tenant ON tenant_data_schemas(tenant_id);
CREATE INDEX idx_dynamic_data_tenant ON tenant_dynamic_data(tenant_id, entity_type);

-- Grant permissions (adjust as needed)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;