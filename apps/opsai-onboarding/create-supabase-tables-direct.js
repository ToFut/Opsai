#!/usr/bin/env node

// Direct PostgreSQL connection to create tables
const { Client } = require('pg');

async function createTablesDirectly() {
  console.log('🔧 Creating Supabase tables directly...\n');
  
  // Extract connection details from Supabase URL
  const supabaseUrl = 'https://dqmufpexuuvlulpilirt.supabase.co';
  const projectRef = 'dqmufpexuuvlulpilirt';
  
  // Create PostgreSQL connection
  const client = new Client({
    host: `aws-0-us-west-1.pooler.supabase.com`,
    port: 5432,
    database: 'postgres',
    user: `postgres.${projectRef}`,
    password: process.env.SUPABASE_DB_PASSWORD || 'your-db-password',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to Supabase');

    // Create tables
    const createTablesSQL = `
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

    console.log('Creating tables...');
    await client.query(createTablesSQL);
    console.log('✅ All tables created successfully!');

    // Test tables
    const tables = ['tenant_integrations', 'tenant_sample_data', 'tenant_data_schemas', 'tenant_dynamic_data'];
    
    console.log('\n🧪 Testing tables...');
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ ${table}: working (${result.rows[0].count} records)`);
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    console.log('\n🎉 Supabase setup complete!');
    console.log('🚀 Your OAuth flow will now use Supabase instead of temp storage!');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n📋 Manual setup required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/dqmufpexuuvlulpilirt/editor');
    console.log('2. Click "SQL Editor" → "New Query"');
    console.log('3. Copy the SQL from QUICK_SUPABASE_SETUP.txt');
    console.log('4. Click "RUN"');
  } finally {
    await client.end();
  }
}

createTablesDirectly().catch(console.error);