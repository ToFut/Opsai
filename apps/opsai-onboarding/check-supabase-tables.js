#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function checkSupabaseTables() {
  console.log('🔍 Checking what tables exist in Supabase...\n');
  
  try {
    // Check what tables actually exist
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.log('❌ Error fetching table list:', error.message);
      return;
    }
    
    console.log('📋 Tables in Supabase:');
    if (tables && tables.length > 0) {
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    } else {
      console.log('  (No tables found)');
    }
    
    // Check our specific tables
    const ourTables = [
      'tenant_integrations',
      'tenant_sample_data', 
      'tenant_data_schemas',
      'tenant_dynamic_data',
      'tenant_airbyte_connections'
    ];
    
    console.log('\n🎯 Our required tables:');
    for (const tableName of ourTables) {
      const exists = tables?.some(t => t.table_name === tableName);
      console.log(`  ${exists ? '✅' : '❌'} ${tableName}`);
      
      // If it exists, try to query it
      if (exists) {
        try {
          const { data, error: queryError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (queryError) {
            console.log(`    🔒 RLS Error: ${queryError.message}`);
          } else {
            console.log(`    ✅ Accessible (${data?.length || 0} records)`);
          }
        } catch (err) {
          console.log(`    ❌ Query failed: ${err.message}`);
        }
      }
    }
    
    // Check if there are any existing tables we could work with
    console.log('\n💡 Alternative: Use existing tables');
    if (tables && tables.length > 0) {
      console.log('You have these existing tables that might work:');
      tables.forEach(table => {
        if (!table.table_name.startsWith('auth_') && 
            !table.table_name.startsWith('storage_') &&
            !table.table_name.startsWith('realtime_')) {
          console.log(`  📋 ${table.table_name} (could be used for data)`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  }
}

checkSupabaseTables().catch(console.error);