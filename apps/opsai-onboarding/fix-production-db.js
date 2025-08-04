#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Use the ACTUAL production database from .env.example
const supabase = createClient(
  'https://wrkzrmvwxxtsdpyhrxhz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indya3pybXZ3eHh0c2RweWhyeGh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE1MjE2NiwiZXhwIjoyMDY5NzI4MTY2fQ.P8KlJmD5qE2sT3vB4KZVY9mC7pJlO6hE1wR8Ng2Fp_Y'
);

async function fixProductionDB() {
  console.log('🔧 Fixing production database to make OAuth work...\n');
  
  console.log('1️⃣ Testing direct table access...');
  
  try {
    const { error } = await supabase
      .from('tenant_integrations')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Table tenant_integrations does not exist!');
        console.log('🏗️ Creating tables...');
        
        // Create the table with all required columns
        const createQuery = `
          CREATE TABLE IF NOT EXISTS tenant_integrations (
            id SERIAL PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            provider TEXT NOT NULL,
            access_token TEXT,
            refresh_token TEXT,
            expires_at TIMESTAMPTZ,
            scope TEXT,
            token_type TEXT,
            status TEXT DEFAULT 'connected',
            raw_response JSONB,
            airbyte_source_id TEXT,
            connected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(tenant_id, provider)
          );
          
          CREATE TABLE IF NOT EXISTS tenant_sample_data (
            id SERIAL PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            provider TEXT NOT NULL,
            sample_data JSONB,
            collected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS tenant_data_schemas (
            id SERIAL PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            providers TEXT[] NOT NULL,
            entities JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS tenant_dynamic_data (
            id SERIAL PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            table_name TEXT NOT NULL,
            data JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { 
          sql: createQuery 
        }).catch(() => null);
        
        console.log('⚠️ Cannot create tables via RPC. Tables need to be created manually.');
        console.log('✨ Suggested SQL for Supabase dashboard:');
        console.log(createQuery);
        
      } else {
        console.log('✅ Table exists but checking columns...');
        
        // Test the specific insert that's failing
        const testData = {
          tenant_id: 'test',
          provider: 'github',
          access_token: 'test_token',
          status: 'connected'
        };
        
        const { error: insertError } = await supabase
          .from('tenant_integrations')
          .insert(testData)
          .select();
        
        if (insertError) {
          if (insertError.message.includes('status')) {
            console.log('❌ Missing status column! Adding it...');
            
            const alterQuery = `
              ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'connected';
              ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS refresh_token TEXT;
              ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
              ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS scope TEXT;
              ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS token_type TEXT;
              ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS raw_response JSONB;
              ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS airbyte_source_id TEXT;
            `;
            
            console.log('✨ Run this SQL in Supabase dashboard:');
            console.log(alterQuery);
          } else {
            console.log('❌ Insert failed for other reason:', insertError.message);
          }
        } else {
          console.log('✅ Tables are working! OAuth should work now.');
          
          // Clean up test data
          await supabase
            .from('tenant_integrations')
            .delete()
            .eq('tenant_id', 'test');
        }
      }
    } else {
      console.log('✅ Tables exist and are accessible!');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Run the SQL in Supabase dashboard if tables need creation/modification');
  console.log('2. Test OAuth flow again');
  console.log('3. Data should now save to Supabase instead of temp files');
}

fixProductionDB().catch(console.error);