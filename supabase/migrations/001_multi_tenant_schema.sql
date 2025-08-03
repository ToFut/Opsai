-- Multi-Tenant Management Schema for OpsAI Platform
-- This migration creates all necessary tables for tenant management, Airbyte integrations, and OAuth state tracking

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tenants table (core tenant information)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) UNIQUE NOT NULL, -- e.g., 'tenant_abc123'
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, deleted
    metadata JSONB DEFAULT '{}',
    business_profile JSONB DEFAULT '{}', -- industry, size, type, etc.
    subscription_tier VARCHAR(50) DEFAULT 'free', -- free, starter, pro, enterprise
    usage_limits JSONB DEFAULT '{"max_connections": 5, "max_syncs_per_day": 10}'
);

-- Create tenant_integrations table (tracks which integrations a tenant has connected)
CREATE TABLE IF NOT EXISTS tenant_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL, -- e.g., 'salesforce', 'stripe', 'slack'
    status VARCHAR(50) DEFAULT 'pending', -- pending, connected, failed, disconnected
    connected_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    configuration JSONB DEFAULT '{}', -- Provider-specific config
    features_enabled JSONB DEFAULT '[]', -- Which features this integration enables
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(tenant_id, provider)
);

-- Create tenant_sources table (Airbyte source tracking)
CREATE TABLE IF NOT EXISTS tenant_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    airbyte_source_id VARCHAR(255) UNIQUE NOT NULL, -- Airbyte's source ID
    source_type VARCHAR(100) NOT NULL, -- e.g., 'postgres', 'salesforce', 'stripe'
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, failed, deleted
    connection_config JSONB DEFAULT '{}', -- Non-sensitive config only
    discovered_schema JSONB DEFAULT '{}', -- Schema discovered from source
    sample_data JSONB DEFAULT '{}', -- Sample data for UI generation
    last_test_at TIMESTAMP WITH TIME ZONE,
    last_test_status VARCHAR(50), -- success, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tenant_airbyte_connections table (tracks Airbyte connections)
CREATE TABLE IF NOT EXISTS tenant_airbyte_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES tenant_sources(id) ON DELETE CASCADE,
    airbyte_connection_id VARCHAR(255) UNIQUE,
    destination_id VARCHAR(255), -- Airbyte destination ID
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, paused, failed
    sync_frequency VARCHAR(50) DEFAULT 'hourly', -- manual, hourly, daily, weekly
    last_sync_at TIMESTAMP WITH TIME ZONE,
    next_sync_at TIMESTAMP WITH TIME ZONE,
    sync_stats JSONB DEFAULT '{}', -- records synced, errors, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create oauth_states table (for OAuth flow security)
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_token VARCHAR(255) UNIQUE NOT NULL,
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL,
    redirect_uri TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '10 minutes'),
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tenant_apps table (generated applications)
CREATE TABLE IF NOT EXISTS tenant_apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    app_name VARCHAR(255) NOT NULL,
    app_type VARCHAR(100), -- b2b, b2c, saas, marketplace, etc.
    deployment_url TEXT,
    vercel_project_id VARCHAR(255),
    github_repo VARCHAR(255),
    status VARCHAR(50) DEFAULT 'generating', -- generating, deployed, failed, updating
    features JSONB DEFAULT '[]', -- List of enabled features
    database_schema VARCHAR(255), -- e.g., 'tenant_abc123'
    environment_vars JSONB DEFAULT '{}', -- Non-sensitive env vars
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deployed_at TIMESTAMP WITH TIME ZONE
);

-- Create tenant_workflows table (workflow configurations)
CREATE TABLE IF NOT EXISTS tenant_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    workflow_name VARCHAR(255) NOT NULL,
    workflow_type VARCHAR(100), -- onboarding, data_sync, notification, etc.
    enabled BOOLEAN DEFAULT TRUE,
    configuration JSONB DEFAULT '{}',
    schedule VARCHAR(100), -- cron expression or temporal schedule
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create audit_logs table (for compliance and debugging)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) REFERENCES tenants(tenant_id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL, -- e.g., 'integration.connected', 'app.deployed'
    actor_id VARCHAR(255), -- User or system that performed the action
    resource_type VARCHAR(100), -- integration, app, workflow, etc.
    resource_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_created_at ON tenants(created_at DESC);
CREATE INDEX idx_tenant_integrations_tenant_id ON tenant_integrations(tenant_id);
CREATE INDEX idx_tenant_integrations_provider ON tenant_integrations(provider);
CREATE INDEX idx_tenant_integrations_status ON tenant_integrations(status);
CREATE INDEX idx_tenant_sources_tenant_id ON tenant_sources(tenant_id);
CREATE INDEX idx_tenant_sources_source_type ON tenant_sources(source_type);
CREATE INDEX idx_tenant_sources_status ON tenant_sources(status);
CREATE INDEX idx_tenant_airbyte_connections_tenant_id ON tenant_airbyte_connections(tenant_id);
CREATE INDEX idx_tenant_airbyte_connections_status ON tenant_airbyte_connections(status);
CREATE INDEX idx_oauth_states_state_token ON oauth_states(state_token);
CREATE INDEX idx_oauth_states_expires_at ON oauth_states(expires_at);
CREATE INDEX idx_tenant_apps_tenant_id ON tenant_apps(tenant_id);
CREATE INDEX idx_tenant_apps_status ON tenant_apps(status);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_integrations_updated_at BEFORE UPDATE ON tenant_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_sources_updated_at BEFORE UPDATE ON tenant_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_airbyte_connections_updated_at BEFORE UPDATE ON tenant_airbyte_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_apps_updated_at BEFORE UPDATE ON tenant_apps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_workflows_updated_at BEFORE UPDATE ON tenant_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_airbyte_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create service role policy (for backend operations)
CREATE POLICY "Service role can access all tenants" ON tenants
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all integrations" ON tenant_integrations
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all sources" ON tenant_sources
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all connections" ON tenant_airbyte_connections
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all apps" ON tenant_apps
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all workflows" ON tenant_workflows
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all audit logs" ON audit_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Insert sample data for testing
INSERT INTO tenants (tenant_id, name, business_profile, status) VALUES
    ('demo_tenant', 'Demo Company', '{"industry": "saas", "size": "medium", "type": "b2b"}', 'active')
ON CONFLICT (tenant_id) DO NOTHING;

-- Create a function to clean up expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_states WHERE expires_at < NOW() AND used = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a cron job to clean up expired OAuth states (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-oauth-states', '*/10 * * * *', 'SELECT cleanup_expired_oauth_states();');