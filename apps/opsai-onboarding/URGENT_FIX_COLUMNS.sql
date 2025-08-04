-- URGENT: Add missing columns to make OAuth work
-- Run this SQL in Supabase Dashboard: https://dqmufpexuuvlulpilirt.supabase.co/project/dqmufpexuuvlulpilirt/sql

ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'connected';
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS scope TEXT;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS token_type TEXT;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS raw_response JSONB;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS airbyte_source_id TEXT;

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'tenant_integrations' 
ORDER BY ordinal_position;