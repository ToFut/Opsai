#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function listAllTables() {
  console.log('🔍 LISTING ALL DATABASE TABLES\n');

  try {
    // Use raw SQL to get all tables
    const { data: tables, error } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `
      });

    if (error) {
      console.log('❌ Error fetching tables:', error.message);
      
      // Try alternative approach
      console.log('\n🔄 Trying alternative approach...');
      
      const { data: altTables, error: altError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');

      if (altError) {
        console.log('❌ Alternative approach also failed:', altError.message);
        return;
      }

      console.log(`📊 Found ${altTables.length} tables:\n`);
      altTables.forEach(table => {
        console.log(`  • ${table.tablename}`);
      });
      
      return;
    }

    console.log(`📊 Found ${tables.length} tables:\n`);
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

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listAllTables(); 