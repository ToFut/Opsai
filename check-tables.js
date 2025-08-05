#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function checkTables() {
  console.log('🔍 CHECKING DATABASE TABLES\n');

  try {
    // Check all tables in the database
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      console.log('❌ Error fetching tables:', error.message);
      return;
    }

    console.log(`📊 Found ${tables.length} tables in the database:\n`);
    
    tables.forEach(table => {
      console.log(`  • ${table.table_name}`);
    });

    // Check for GitHub-related tables
    console.log('\n🔍 GITHUB-RELATED TABLES:');
    console.log('========================');
    
    const githubTables = tables.filter(table => 
      table.table_name.toLowerCase().includes('github') ||
      table.table_name.toLowerCase().includes('repo') ||
      table.table_name.toLowerCase().includes('user_')
    );

    if (githubTables.length > 0) {
      githubTables.forEach(table => {
        console.log(`  ✅ ${table.table_name}`);
      });
    } else {
      console.log('  No GitHub-related tables found');
    }

    // Check sample data table
    console.log('\n🔍 SAMPLE DATA TABLE:');
    console.log('====================');
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('sample_data')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.log(`  ❌ Error: ${sampleError.message}`);
    } else {
      console.log(`  ✅ Found ${sampleData.length} sample data records`);
      
      if (sampleData.length > 0) {
        console.log('\n  📋 Sample data structure:');
        Object.keys(sampleData[0]).forEach(key => {
          console.log(`    • ${key}: ${typeof sampleData[0][key]}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables(); 