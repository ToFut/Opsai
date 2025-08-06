-- Create oauth_credentials table
CREATE TABLE IF NOT EXISTS public.oauth_credentials (
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

-- Create airbyte_connections table
CREATE TABLE IF NOT EXISTS public.airbyte_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    connection_id VARCHAR(255),
    source_id VARCHAR(255),
    destination_id VARCHAR(255),
    status VARCHAR(50),
    schedule JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_oauth_user_provider ON public.oauth_credentials(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_connections_user ON public.airbyte_connections(user_id);

-- Enable RLS (optional for now)
ALTER TABLE public.oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airbyte_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies that allow service role full access
CREATE POLICY "Service role has full access to oauth_credentials" ON public.oauth_credentials
    FOR ALL USING (true);

CREATE POLICY "Service role has full access to airbyte_connections" ON public.airbyte_connections
    FOR ALL USING (true);