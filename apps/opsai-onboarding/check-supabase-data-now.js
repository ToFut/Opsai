#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function checkSupabaseDataNow() {
  console.log('🔍 Checking if Supabase has ANY data from OAuth flow...\n');
  
  const tables = [
    'tenant_integrations',
    'tenant_sample_data',
    'tenant_data_schemas',
    'tenant_dynamic_data'
  ];
  
  let totalRecords = 0;
  
  for (const table of tables) {
    console.log(`📋 Checking ${table}:`);
    
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .eq('tenant_id', 'default');
      
      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        
        // If table doesn't exist, that's the problem
        if (error.code === '42P01') {
          console.log(`  🚨 TABLE DOESN'T EXIST! This is why temp storage is used.`);
        }
      } else {
        console.log(`  📊 Records: ${count || 0}`);
        if (count > 0) {
          console.log(`  📝 Sample data:`, data?.slice(0, 1));
          totalRecords += count;
        } else {
          console.log(`  📭 Empty table`);
        }
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
    }
    
    console.log('');
  }
  
  console.log(`📊 TOTAL RECORDS IN SUPABASE: ${totalRecords}`);
  
  if (totalRecords === 0) {
    console.log('\n🚨 PROBLEM IDENTIFIED:');
    console.log('Supabase is completely empty because:');
    console.log('1. Tables might not exist properly');
    console.log('2. OAuth callback is failing to save and falling back to temp storage');
    console.log('3. The "status" column is still missing');
    
    console.log('\n🧪 Let me test a simple insert right now...');
    
    // Test if we can insert data successfully
    try {
      const { data, error } = await supabase
        .from('tenant_sample_data')
        .insert({
          tenant_id: 'test_insert',
          provider: 'test',
          sample_data: { test: true }
        })
        .select();
      
      if (error) {
        console.log('❌ Insert test FAILED:', error.message);
        console.log('This is why OAuth falls back to temp storage!');
      } else {
        console.log('✅ Insert test PASSED - tables are working');
        console.log('The problem must be in the OAuth callback code...');
        
        // Clean up
        await supabase
          .from('tenant_sample_data')
          .delete()
          .eq('tenant_id', 'test_insert');
      }
    } catch (err) {
      console.log('❌ Insert test EXCEPTION:', err.message);
    }
  } else {
    console.log('\n✅ SUCCESS: Supabase has data from OAuth flow!');
  }
}

checkSupabaseDataNow().catch(console.error);