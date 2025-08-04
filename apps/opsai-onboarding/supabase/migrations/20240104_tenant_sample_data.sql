-- Create table for storing sample data per tenant
CREATE TABLE IF NOT EXISTS tenant_sample_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  sample_data JSONB NOT NULL,
  data_analysis JSONB,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, provider)
);

-- Create index for faster lookups
CREATE INDEX idx_tenant_sample_data_tenant_provider ON tenant_sample_data(tenant_id, provider);

-- Create table for organized tenant data schemas
CREATE TABLE IF NOT EXISTS tenant_data_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  schema_version INTEGER DEFAULT 1,
  providers JSONB NOT NULL, -- List of connected providers
  entities JSONB NOT NULL, -- Entity definitions
  relationships JSONB NOT NULL, -- Entity relationships
  indexes JSONB, -- Recommended indexes
  views JSONB, -- Materialized views
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deployed BOOLEAN DEFAULT FALSE,
  UNIQUE(tenant_id, schema_version)
);

-- Create table for tenant-specific data tables (multi-tenant approach)
CREATE TABLE IF NOT EXISTS tenant_dynamic_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL, -- e.g., 'github_repositories', 'stripe_customers'
  entity_id VARCHAR(255) NOT NULL, -- Original ID from provider
  data JSONB NOT NULL, -- Full entity data
  metadata JSONB, -- Additional metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(tenant_id, entity_type, entity_id)
);

-- Create indexes for performance
CREATE INDEX idx_tenant_dynamic_data_lookup ON tenant_dynamic_data(tenant_id, entity_type);
CREATE INDEX idx_tenant_dynamic_data_entity ON tenant_dynamic_data(entity_id);
CREATE INDEX idx_tenant_dynamic_data_gin ON tenant_dynamic_data USING gin(data);

-- Row Level Security
ALTER TABLE tenant_sample_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_data_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_dynamic_data ENABLE ROW LEVEL SECURITY;

-- Policies for tenant isolation
CREATE POLICY tenant_sample_data_isolation ON tenant_sample_data
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true));

CREATE POLICY tenant_schemas_isolation ON tenant_data_schemas
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true));

CREATE POLICY tenant_dynamic_data_isolation ON tenant_dynamic_data
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_tenant_sample_data_updated_at BEFORE UPDATE ON tenant_sample_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_dynamic_data_updated_at BEFORE UPDATE ON tenant_dynamic_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();