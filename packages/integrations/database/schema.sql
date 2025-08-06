-- OAuth Credentials Table
CREATE TABLE IF NOT EXISTS oauth_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    scope TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Airbyte Connections Table
CREATE TABLE IF NOT EXISTS airbyte_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    connection_id VARCHAR(255) NOT NULL,
    source_id VARCHAR(255) NOT NULL,
    destination_id VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    schedule JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Airbyte Destinations Table
CREATE TABLE IF NOT EXISTS airbyte_destinations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    destination_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sync Logs Table
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    connection_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(50),
    records_synced INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Deployments Table
CREATE TABLE IF NOT EXISTS user_deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    deployment_url TEXT,
    backend_url TEXT,
    status VARCHAR(50),
    deployed_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oauth_user_provider ON oauth_credentials(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_connections_user ON airbyte_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_connection ON sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user ON sync_logs(user_id);

-- Create RLS policies (if using Supabase)
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE airbyte_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_deployments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own credentials" ON oauth_credentials
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own connections" ON airbyte_connections
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own sync logs" ON sync_logs
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own deployments" ON user_deployments
    FOR SELECT USING (auth.uid()::text = user_id);

-- Function to execute SQL (for analytics queries)
CREATE OR REPLACE FUNCTION execute_sql(query text, params text[] DEFAULT '{}')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Only allow SELECT queries
    IF NOT (query ~* '^\s*SELECT') THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- Execute query and return as JSON
    EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', query)
    INTO result;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;