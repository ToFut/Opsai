#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function debugSupabaseInsert() {
  console.log('🔍 Debugging why Supabase inserts are failing...\n');
  
  // Test the exact same insert that the OAuth callback would do
  console.log('1️⃣ Testing tenant_sample_data insert...');
  
  try {
    const testSampleData = {
      tenant_id: 'default',
      provider: 'github',
      sample_data: {
        provider: 'github',
        recordCount: { repositories: 10, issues: 0 },
        entities: {
          user: { sample: { id: 123, login: 'test' } },
          repositories: { sample: [{ id: 1, name: 'test-repo' }] }
        }
      },
      collected_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('tenant_sample_data')
      .upsert(testSampleData)
      .select();
    
    if (error) {
      console.log('❌ Sample data insert failed:');
      console.log('   Message:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Sample data insert SUCCESS!');
      console.log('   Inserted record ID:', data[0]?.id);
      
      // Clean up
      await supabase
        .from('tenant_sample_data')
        .delete()
        .eq('id', data[0].id);
      console.log('   Cleaned up test record');
    }
  } catch (err) {
    console.log('❌ Exception during sample data insert:', err.message);
    console.log('   Stack:', err.stack?.split('\n')[0]);
  }
  
  console.log('\n2️⃣ Testing tenant_integrations insert...');
  
  try {
    const testIntegration = {
      tenant_id: 'default',
      provider: 'github',
      access_token: 'test_token_123',
      connected_at: new Date().toISOString(),
      status: 'connected'
    };
    
    const { data, error } = await supabase
      .from('tenant_integrations')
      .upsert(testIntegration)
      .select();
    
    if (error) {
      console.log('❌ Integration insert failed:');
      console.log('   Message:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
    } else {
      console.log('✅ Integration insert SUCCESS!');
      console.log('   Inserted record ID:', data[0]?.id);
      
      // Clean up
      await supabase
        .from('tenant_integrations')
        .delete()
        .eq('id', data[0].id);
      console.log('   Cleaned up test record');
    }
  } catch (err) {
    console.log('❌ Exception during integration insert:', err.message);
  }
  
  console.log('\n3️⃣ Testing tenant_data_schemas insert...');
  
  try {
    const testSchema = {
      tenant_id: 'default',
      providers: ['github'],
      entities: { test: { fields: { id: 'serial' } } },
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('tenant_data_schemas')
      .insert(testSchema)
      .select();
    
    if (error) {
      console.log('❌ Schema insert failed:');
      console.log('   Message:', error.message);
      console.log('   Code:', error.code);
    } else {
      console.log('✅ Schema insert SUCCESS!');
      console.log('   Inserted record ID:', data[0]?.id);
      
      // Clean up
      await supabase
        .from('tenant_data_schemas')
        .delete()
        .eq('id', data[0].id);
      console.log('   Cleaned up test record');
    }
  } catch (err) {
    console.log('❌ Exception during schema insert:', err.message);
  }
  
  console.log('\n📊 Summary:');
  console.log('If any inserts failed above, that explains why OAuth is using temp storage.');
  console.log('The most common issue is missing columns or RLS permissions.');
}

debugSupabaseInsert().catch(console.error);