-- Fix missing columns in tenant_integrations table
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'connected';
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS scope TEXT;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS token_type TEXT;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS raw_response JSONB;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS airbyte_source_id TEXT;