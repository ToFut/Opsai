#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function testCompleteOAuthFlow() {
  console.log('🧪 TESTING: Complete OAuth flow to Supabase...\n');
  
  console.log('1️⃣ Testing OAuth integration save...');
  
  const integrationData = {
    tenant_id: 'test_flow',
    provider: 'github',
    access_token: 'test_token_123',
    status: 'connected',
    connected_at: new Date().toISOString()
  };
  
  const { data: integration, error: intError } = await supabase
    .from('tenant_integrations')
    .insert(integrationData)
    .select();
  
  if (intError) {
    console.log('❌ OAuth integration save failed:', intError.message);
    return;
  }
  
  console.log('✅ OAuth integration saved! ID:', integration[0].id);
  
  console.log('\n2️⃣ Testing sample data save...');
  
  const sampleData = {
    tenant_id: 'test_flow',
    provider: 'github',
    sample_data: {
      provider: 'github',
      recordCount: { repositories: 2 },
      entities: {
        user: { sample: { id: 123, login: 'testuser' } },
        repositories: { sample: [{ id: 1, name: 'test-repo' }] }
      }
    },
    collected_at: new Date().toISOString()
  };
  
  const { data: sampleResult, error: sampleError } = await supabase
    .from('tenant_sample_data')
    .insert(sampleData)
    .select();
  
  if (sampleError) {
    console.log('❌ Sample data save failed:', sampleError.message);
  } else {
    console.log('✅ Sample data saved! ID:', sampleResult[0].id);
  }
  
  console.log('\n3️⃣ Testing schema save...');
  
  const schemaData = {
    tenant_id: 'test_flow',
    providers: ['github'],
    entities: {
      users: { columns: { id: 'SERIAL PRIMARY KEY', login: 'VARCHAR(255)' } },
      repositories: { columns: { id: 'SERIAL PRIMARY KEY', name: 'VARCHAR(255)' } }
    }
  };
  
  const { data: schemaResult, error: schemaError } = await supabase
    .from('tenant_data_schemas')
    .insert(schemaData)
    .select();
  
  if (schemaError) {
    console.log('❌ Schema save failed:', schemaError.message);
  } else {
    console.log('✅ Schema saved! ID:', schemaResult[0].id);
  }
  
  console.log('\n🧹 Cleaning up test data...');
  
  // Clean up in reverse order
  if (schemaResult?.[0]?.id) {
    await supabase.from('tenant_data_schemas').delete().eq('id', schemaResult[0].id);
  }
  
  if (sampleResult?.[0]?.id) {
    await supabase.from('tenant_sample_data').delete().eq('id', sampleResult[0].id);
  }
  
  if (integration?.[0]?.id) {
    await supabase.from('tenant_integrations').delete().eq('id', integration[0].id);
  }
  
  console.log('✅ Test data cleaned up');
  
  console.log('\n🎯 RESULT:');
  
  const allWorked = !intError && !sampleError && !schemaError;
  
  if (allWorked) {
    console.log('🟢 SUCCESS: Complete OAuth flow will now save to Supabase!');
    console.log('   - OAuth integrations ✅');
    console.log('   - Sample data collection ✅'); 
    console.log('   - AI database organization ✅');
    console.log('\n🚀 Next: Test actual OAuth connection to see data in Supabase');
  } else {
    console.log('🔴 ISSUES FOUND:');
    if (intError) console.log('   - OAuth integrations ❌');
    if (sampleError) console.log('   - Sample data collection ❌');
    if (schemaError) console.log('   - AI database organization ❌');
  }
}

testCompleteOAuthFlow().catch(console.error);