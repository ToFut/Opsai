#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function checkSupabaseDirectly() {
  console.log('🔍 DIRECT CHECK: Current Supabase data state...\n');
  
  const tables = [
    'tenant_integrations',
    'tenant_sample_data', 
    'tenant_data_schemas',
    'tenant_dynamic_data'
  ];
  
  let foundAnyData = false;
  
  for (const table of tables) {
    console.log(`📋 Checking ${table}:`);
    
    try {
      // Check total count
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.log(`  ❌ Error: ${countError.message}`);
        if (countError.code === '42P01') {
          console.log(`  🚨 TABLE DOESN'T EXIST!`);
        }
        continue;
      }
      
      console.log(`  📊 Total records: ${count}`);
      
      if (count > 0) {
        foundAnyData = true;
        
        // Get actual data
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(3);
          
        if (!error && data) {
          console.log(`  📝 Sample records:`, JSON.stringify(data, null, 2));
        }
      } else {
        console.log(`  📭 Table is empty`);
      }
      
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
    }
    
    console.log('');
  }
  
  console.log(`📊 RESULT: ${foundAnyData ? '✅ FOUND DATA' : '❌ NO DATA FOUND'}`);
  
  if (!foundAnyData) {
    console.log('\n🔬 TESTING: Why OAuth isn\'t saving...');
    
    // Test the exact insert that OAuth callback does
    console.log('1️⃣ Testing tenant_integrations insert (what OAuth callback does)...');
    
    const oauthData = {
      tenant_id: 'default',
      provider: 'github',
      access_token: 'test_token_123',
      status: 'connected',
      connected_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('tenant_integrations')
      .insert(oauthData)
      .select();
    
    if (insertError) {
      console.log('❌ OAuth-style insert FAILED:', insertError.message);
      console.log('   This is why OAuth falls back to temp storage!');
      
      if (insertError.message.includes('status')) {
        console.log('\n🚨 MISSING COLUMN: The status column is missing!');
        console.log('💡 SOLUTION: Run URGENT_FIX_COLUMNS.sql in Supabase Dashboard');
      }
    } else {
      console.log('✅ OAuth-style insert WORKED!');
      console.log('   Record ID:', insertData[0]?.id);
      
      // Clean up
      await supabase
        .from('tenant_integrations')
        .delete()
        .eq('id', insertData[0].id);
        
      console.log('   Cleaned up test record');
      console.log('\n🤔 If insert works, why is OAuth using temp storage?');
      console.log('   Check the OAuth callback code for logic issues...');
    }
  }
  
  console.log('\n📝 NEXT STEPS:');
  console.log('1. If you see "status column missing" - run URGENT_FIX_COLUMNS.sql');
  console.log('2. Test OAuth connection to github again');
  console.log('3. Check if data appears in Supabase this time');
}

checkSupabaseDirectly().catch(console.error);