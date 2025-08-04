#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function setupTables() {
  console.log('🔧 Setting up database tables...\n');
  
  try {
    // Create tenant_integrations table
    const { error: intError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (intError) {
      console.log('Creating tenant_integrations table via SQL...');
      // Try direct SQL if RPC doesn't work
    }
    
    // Create tenant_sample_data table
    const { error: sampleError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS tenant_sample_data (
          id SERIAL PRIMARY KEY,
          tenant_id VARCHAR(255) NOT NULL,
          provider VARCHAR(100) NOT NULL,
          sample_data JSONB NOT NULL,
          data_analysis JSONB,
          collected_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(tenant_id, provider)
        );
      `
    });
    
    // Create tenant_data_schemas table
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    // Create tenant_dynamic_data table
    const { error: dynamicError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    // Create tenant_airbyte_connections table
    const { error: airbyteError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    console.log('✅ All tables created successfully!');
    
  } catch (error) {
    console.error('Error creating tables:', error);
    
    // If exec_sql doesn't work, we'll need to create tables through Supabase dashboard
    console.log('\n⚠️  If table creation failed, please create the tables manually in Supabase dashboard.');
    console.log('Go to: https://supabase.com/dashboard/project/dqmufpexuuvlulpilirt/editor');
    console.log('And run the SQL from: supabase/migrations/20240104_tenant_sample_data.sql');
  }
}

// Run setup
setupTables().catch(console.error);