#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function verifySupabaseTables() {
  console.log('🧪 Testing Supabase tables after SQL creation...\n');
  
  const tables = [
    'tenant_integrations',
    'tenant_sample_data', 
    'tenant_data_schemas',
    'tenant_dynamic_data',
    'tenant_airbyte_connections'
  ];

  let workingTables = 0;
  
  for (const table of tables) {
    try {
      console.log(`Testing ${table}...`);
      
      // Try to insert test data
      const { data, error } = await supabase
        .from(table)
        .insert({
          tenant_id: 'test_verification',
          ...(table === 'tenant_integrations' && { provider: 'test', status: 'test' }),
          ...(table === 'tenant_sample_data' && { provider: 'test', sample_data: { test: true } }),
          ...(table === 'tenant_data_schemas' && { providers: ['test'], entities: { test: true } }),
          ...(table === 'tenant_dynamic_data' && { entity_type: 'test', entity_id: 'test', data: { test: true } }),
          ...(table === 'tenant_airbyte_connections' && { provider: 'test', status: 'test' })
        })
        .select();
      
      if (!error && data) {
        console.log(`✅ ${table} is working!`);
        workingTables++;
        
        // Clean up test data
        await supabase
          .from(table)
          .delete()
          .eq('tenant_id', 'test_verification');
          
      } else {
        console.log(`❌ ${table} failed:`, error?.message || 'Unknown error');
      }
    } catch (err) {
      console.log(`❌ ${table} error:`, err.message);
    }
  }
  
  console.log(`\n📊 Results: ${workingTables}/${tables.length} tables working`);
  
  if (workingTables === tables.length) {
    console.log('\n🎉 SUCCESS! All tables are working!');
    console.log('✅ OAuth flow will NOW use Supabase instead of temp storage');
    console.log('\n🚀 Test it now:');
    console.log('1. Go to http://localhost:7250/onboarding-v3');
    console.log('2. Connect providers (GitHub, Google, etc.)');
    console.log('3. Data will save directly to Supabase! 🎯');
    
    console.log('\n🔍 Monitor in real-time:');
    console.log('SELECT * FROM tenant_integrations;');
    console.log('SELECT * FROM tenant_sample_data;');
    console.log('SELECT * FROM tenant_data_schemas;');
  } else {
    console.log('\n⚠️  Some tables are not working yet.');
    console.log('Make sure you ran the SQL from FINAL_SQL_SOLUTION.sql');
  }
}

verifySupabaseTables().catch(console.error);