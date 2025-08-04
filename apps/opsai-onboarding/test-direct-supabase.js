#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function testDirectSupabase() {
  console.log('🧪 Testing direct Supabase connection...\n');
  
  // Test if we can access any default tables
  const testTables = ['apps', 'users', 'tenant_integrations'];
  
  for (const table of testTables) {
    console.log(`Testing table: ${table}`);
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        console.log(`  📋 Code: ${error.code}`);
        console.log(`  📋 Details: ${error.details}`);
        console.log(`  📋 Hint: ${error.hint}`);
      } else {
        console.log(`  ✅ Success! Found ${data?.length || 0} records`);
        if (data && data.length > 0) {
          console.log(`  📊 Sample record keys:`, Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
    }
    console.log('');
  }
  
  // Test a simple insert to see what happens
  console.log('🧪 Testing simple insert...');
  try {
    const { data, error } = await supabase
      .from('test_table')
      .insert({ test: 'value' })
      .select();
    
    if (error) {
      console.log(`❌ Insert error: ${error.message}`);
      if (error.message.includes('does not exist')) {
        console.log('✅ This is expected - table doesn\'t exist yet');
      }
    } else {
      console.log('✅ Insert worked!');
    }
  } catch (err) {
    console.log(`❌ Insert exception: ${err.message}`);
  }
}

testDirectSupabase().catch(console.error);