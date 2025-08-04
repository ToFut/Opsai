#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function createTables() {
  console.log('🔧 Creating Supabase tables for OAuth flow...\n');
  
  const tables = [
    {
      name: 'tenant_integrations',
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
    },
    {
      name: 'tenant_sample_data',
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
    },
    {
      name: 'tenant_data_schemas',
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
    },
    {
      name: 'tenant_dynamic_data',
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
    },
    {
      name: 'tenant_airbyte_connections',
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
    }
  ];

  // Use the Supabase admin client to execute raw SQL
  for (const table of tables) {
    try {
      console.log(`Creating table: ${table.name}...`);
      
      // Use the rpc function to execute SQL
      const { data, error } = await supabase.rpc('exec', {
        sql: table.sql
      });
      
      if (error) {
        // Try alternative method - direct query
        console.log(`Trying alternative method for ${table.name}...`);
        
        // Use REST API directly
        const response = await fetch('https://dqmufpexuuvlulpilirt.supabase.co/rest/v1/rpc/exec', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
          },
          body: JSON.stringify({ sql: table.sql })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }
      
      console.log(`✅ Created table: ${table.name}`);
      
    } catch (err) {
      console.log(`⚠️  Could not create ${table.name} programmatically:`, err.message);
    }
  }

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_tenant_integrations_tenant ON tenant_integrations(tenant_id);',
    'CREATE INDEX IF NOT EXISTS idx_sample_data_tenant ON tenant_sample_data(tenant_id);',
    'CREATE INDEX IF NOT EXISTS idx_schemas_tenant ON tenant_data_schemas(tenant_id);',
    'CREATE INDEX IF NOT EXISTS idx_dynamic_data_tenant ON tenant_dynamic_data(tenant_id, entity_type);'
  ];

  console.log('\n📊 Creating indexes...');
  for (const indexSQL of indexes) {
    try {
      await supabase.rpc('exec', { sql: indexSQL });
      console.log('✅ Index created');
    } catch (err) {
      console.log('⚠️  Index creation skipped');
    }
  }

  // Test if tables exist by trying to query them
  console.log('\n🧪 Testing table creation...');
  
  const testQueries = [
    { name: 'tenant_integrations', table: 'tenant_integrations' },
    { name: 'tenant_sample_data', table: 'tenant_sample_data' },
    { name: 'tenant_data_schemas', table: 'tenant_data_schemas' },
    { name: 'tenant_dynamic_data', table: 'tenant_dynamic_data' }
  ];

  let tablesCreated = 0;
  
  for (const test of testQueries) {
    try {
      const { data, error } = await supabase
        .from(test.table)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✅ Table ${test.name} is working`);
        tablesCreated++;
      } else {
        console.log(`❌ Table ${test.name} not accessible:`, error.message);
      }
    } catch (err) {
      console.log(`❌ Table ${test.name} test failed:`, err.message);
    }
  }

  console.log(`\n📋 Summary: ${tablesCreated}/4 tables are working`);
  
  if (tablesCreated === 4) {
    console.log('\n🎉 All tables created successfully!');
    console.log('✅ OAuth flow will now use Supabase instead of temp storage');
    console.log('\n🚀 Test the flow:');
    console.log('1. Go to http://localhost:7250/onboarding-v3');
    console.log('2. Connect providers (GitHub, Google, etc.)');
    console.log('3. Click "Next" - data will save to Supabase!');
  } else {
    console.log('\n⚠️  Some tables could not be created programmatically.');
    console.log('📋 Manual setup required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/dqmufpexuuvlulpilirt/editor');
    console.log('2. Click "SQL Editor" → "New Query"');
    console.log('3. Copy the SQL from setup-oauth-tables.sql and run it');
  }
}

createTables().catch(console.error);