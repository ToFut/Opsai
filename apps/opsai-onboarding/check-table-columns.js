#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function checkTableColumns() {
  console.log('🔍 Checking tenant_sample_data table structure...\n');
  
  // Test the exact insert that's failing
  const testData = {
    tenant_id: 'test',
    provider: 'github',
    sample_data: { test: true },
    data_analysis: { test: 'analysis' },  // This column likely doesn't exist
    collected_at: new Date().toISOString()
  };
  
  console.log('1️⃣ Testing sample data insert with data_analysis column...');
  
  const { error } = await supabase
    .from('tenant_sample_data')
    .insert(testData);
  
  if (error) {
    console.log('❌ Insert failed:', error.message);
    
    if (error.message.includes('data_analysis')) {
      console.log('\n🚨 MISSING COLUMN: data_analysis column is missing!');
      
      // Test without the problematic column
      console.log('\n2️⃣ Testing without data_analysis column...');
      
      const { data: successData, error: retryError } = await supabase
        .from('tenant_sample_data')
        .insert({
          tenant_id: 'test',
          provider: 'github', 
          sample_data: { test: true },
          collected_at: new Date().toISOString()
        })
        .select();
      
      if (retryError) {
        console.log('❌ Still failed:', retryError.message);
      } else {
        console.log('✅ Insert worked without data_analysis!');
        console.log('   Record ID:', successData[0]?.id);
        
        // Clean up
        await supabase
          .from('tenant_sample_data')
          .delete()
          .eq('id', successData[0].id);
      }
    }
  } else {
    console.log('✅ Insert with data_analysis worked!');
  }
  
  console.log('\n💡 SOLUTION:');
  console.log('Either:');
  console.log('1. Add data_analysis column: ALTER TABLE tenant_sample_data ADD COLUMN data_analysis JSONB;');
  console.log('2. Or remove data_analysis from the OAuth callback insert');
}

checkTableColumns().catch(console.error);