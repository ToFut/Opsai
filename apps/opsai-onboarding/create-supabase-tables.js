#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function createTables() {
  console.log('🔧 Creating database tables in Supabase...\n');
  
  const createTableSQL = `
    -- Create tenant_integrations table
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

    -- Create tenant_sample_data table
    CREATE TABLE IF NOT EXISTS tenant_sample_data (
      id SERIAL PRIMARY KEY,
      tenant_id VARCHAR(255) NOT NULL,
      provider VARCHAR(100) NOT NULL,
      sample_data JSONB NOT NULL,
      data_analysis JSONB,
      collected_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(tenant_id, provider)
    );

    -- Create tenant_data_schemas table
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

    -- Create tenant_dynamic_data table
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

    -- Create tenant_airbyte_connections table
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
    CREATE INDEX IF NOT EXISTS idx_tenant_integrations_tenant ON tenant_integrations(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_sample_data_tenant ON tenant_sample_data(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_schemas_tenant ON tenant_data_schemas(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_dynamic_data_tenant ON tenant_dynamic_data(tenant_id, entity_type);
  `;

  try {
    // Use the REST API to execute SQL
    const response = await fetch(`https://dqmufpexuuvlulpilirt.supabase.co/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
      },
      body: JSON.stringify({ sql: createTableSQL })
    });

    if (response.ok) {
      console.log('✅ Tables created successfully!');
      
      // Test by checking if tables exist
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['tenant_integrations', 'tenant_sample_data', 'tenant_data_schemas', 'tenant_dynamic_data']);
      
      if (!error && tables) {
        console.log('\n📋 Created tables:');
        tables.forEach(table => console.log(`  ✓ ${table.table_name}`));
      }
      
    } else {
      const error = await response.text();
      console.error('❌ Failed to create tables:', error);
    }
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    console.log('\n📝 Manual Setup Required:');
    console.log('Go to: https://supabase.com/dashboard/project/dqmufpexuuvlulpilirt/editor');
    console.log('Run the SQL from: setup-oauth-tables.sql');
  }
}

createTables().catch(console.error);