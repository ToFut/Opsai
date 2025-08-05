#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function checkSchemaStructure() {
  console.log('🔍 Checking tenant_data_schemas table structure...\n');
  
  try {
    const { data, error } = await supabase
      .from('tenant_data_schemas')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📋 Table columns found:');
      Object.keys(data[0]).forEach(column => {
        console.log(`  - ${column}: ${typeof data[0][column]}`);
      });
      
      console.log('\n📝 Sample record:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('📭 No data found in table');
    }
    
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

checkSchemaStructure().catch(console.error);