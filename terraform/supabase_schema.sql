-- ========================================
-- SUPABASE DATABASE SCHEMA FOR USER MANAGEMENT
-- ========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ========================================
-- USER MANAGEMENT TABLES
-- ========================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    github_username VARCHAR(255),
    ga_property_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth credentials table (encrypted)
CREATE TABLE IF NOT EXISTS public.user_oauth_credentials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    access_token TEXT NOT NULL, -- Encrypted in production
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    provider_user_id VARCHAR(255),
    metadata JSONB DEFAULT '{}', -- Shop domain, repos, property IDs, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Airbyte connections tracking
CREATE TABLE IF NOT EXISTS public.user_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    connection_ids JSONB DEFAULT '{}', -- Terraform output IDs
    status VARCHAR(50) DEFAULT 'pending', -- pending, deployed, failed, disabled
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'waiting', -- waiting, syncing, success, failed
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- User deployments tracking
CREATE TABLE IF NOT EXISTS public.user_deployments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    deployment_url TEXT NOT NULL,
    backend_status VARCHAR(50) DEFAULT 'generated', -- generated, built, deployed, failed
    frontend_status VARCHAR(50) DEFAULT 'generated', -- generated, built, deployed, failed
    deployment_status VARCHAR(50) DEFAULT 'pending', -- pending, deploying, deployed, failed
    build_logs TEXT,
    deployed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI workflow analysis results
CREATE TABLE IF NOT EXISTS public.ai_workflow_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_type VARCHAR(100),
    workflow_patterns JSONB DEFAULT '{}',
    insights JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    churn_risk VARCHAR(20) CHECK (churn_risk IN ('low', 'medium', 'high')),
    growth_potential INTEGER CHECK (growth_potential >= 0 AND growth_potential <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- ========================================
-- DYNAMIC USER SCHEMAS (Created per user)
-- ========================================

-- Function to create user schema when they connect first provider
CREATE OR REPLACE FUNCTION create_user_schema(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    schema_name TEXT;
BEGIN
    schema_name := 'user_' || REPLACE(user_uuid::TEXT, '-', '_');
    
    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    
    -- Grant permissions
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated', schema_name);
    EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO authenticated', schema_name);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO authenticated', schema_name);
    
    -- Create analytics schema for user
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS analytics_%s', REPLACE(user_uuid::TEXT, '-', '_'));
    EXECUTE format('GRANT USAGE ON SCHEMA analytics_%s TO authenticated', REPLACE(user_uuid::TEXT, '-', '_'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflow_analysis ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::TEXT = id::TEXT);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::TEXT = id::TEXT);

-- OAuth credentials policies
CREATE POLICY "Users can view own credentials" ON public.user_oauth_credentials
    FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can insert own credentials" ON public.user_oauth_credentials
    FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can update own credentials" ON public.user_oauth_credentials
    FOR UPDATE USING (auth.uid()::TEXT = user_id::TEXT);

-- Connections policies
CREATE POLICY "Users can view own connections" ON public.user_connections
    FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can manage own connections" ON public.user_connections
    FOR ALL USING (auth.uid()::TEXT = user_id::TEXT);

-- Deployments policies
CREATE POLICY "Users can view own deployments" ON public.user_deployments
    FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can manage own deployments" ON public.user_deployments
    FOR ALL USING (auth.uid()::TEXT = user_id::TEXT);

-- AI analysis policies
CREATE POLICY "Users can view own analysis" ON public.ai_workflow_analysis
    FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "System can insert analysis" ON public.ai_workflow_analysis
    FOR INSERT WITH CHECK (true); -- System service inserts

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON public.user_oauth_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.user_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON public.user_deployments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's latest analysis
CREATE OR REPLACE FUNCTION get_user_latest_analysis(user_uuid UUID)
RETURNS TABLE (
    business_type VARCHAR(100),
    health_score INTEGER,
    churn_risk VARCHAR(20),
    growth_potential INTEGER,
    insights JSONB,
    recommendations JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.business_type,
        a.health_score,
        a.churn_risk,
        a.growth_potential,
        a.insights,
        a.recommendations,
        a.created_at
    FROM public.ai_workflow_analysis a
    WHERE a.user_id = user_uuid
    AND a.expires_at > NOW()
    ORDER BY a.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute raw SQL (for analytics views)
CREATE OR REPLACE FUNCTION execute_sql(query TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_user_id ON public.user_oauth_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_provider ON public.user_oauth_credentials(provider);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON public.user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.user_connections(status);
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON public.user_deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_user_id ON public.ai_workflow_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_created_at ON public.ai_workflow_analysis(created_at);

-- ========================================
-- SAMPLE DATA FOR TESTING
-- ========================================

-- Insert sample user (for testing)
INSERT INTO public.users (id, email, full_name, github_username) 
VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'test@example.com',
    'Test User',
    'testuser'
) ON CONFLICT (email) DO NOTHING;

-- ========================================
-- CLEANUP JOBS
-- ========================================

-- Clean up expired analysis records (runs daily)
SELECT cron.schedule(
    'cleanup-expired-analysis',
    '0 2 * * *', -- 2 AM daily
    'DELETE FROM public.ai_workflow_analysis WHERE expires_at < NOW();'
);

-- Clean up old connection logs (runs weekly)
SELECT cron.schedule(
    'cleanup-old-logs',
    '0 3 * * 0', -- 3 AM every Sunday
    'UPDATE public.user_connections SET error_message = NULL WHERE updated_at < NOW() - INTERVAL ''30 days'';'
);

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- User overview with connection status
CREATE OR REPLACE VIEW public.user_overview AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at as user_since,
    COUNT(uc.provider) as connected_providers,
    ARRAY_AGG(uc.provider) FILTER (WHERE uc.status = 'deployed') as active_providers,
    ud.deployment_url,
    ud.deployment_status,
    aa.health_score,
    aa.churn_risk
FROM public.users u
LEFT JOIN public.user_connections uc ON u.id = uc.user_id
LEFT JOIN public.user_deployments ud ON u.id = ud.user_id
LEFT JOIN public.ai_workflow_analysis aa ON u.id = aa.user_id 
    AND aa.created_at = (
        SELECT MAX(created_at) 
        FROM public.ai_workflow_analysis 
        WHERE user_id = u.id AND expires_at > NOW()
    )
GROUP BY u.id, u.email, u.full_name, u.created_at, ud.deployment_url, ud.deployment_status, aa.health_score, aa.churn_risk;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant access to service role (for system operations)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;