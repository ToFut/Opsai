#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function testFullPipeline() {
  console.log('🧪 TESTING FULL DATA PIPELINE\n');
  
  const tenantId = 'default';
  
  // 1. Check if we have OAuth connections
  console.log('1️⃣ CHECKING OAUTH CONNECTIONS:');
  const { data: integrations } = await supabase
    .from('tenant_integrations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'connected');
  
  console.log(`Found ${integrations?.length || 0} connected integrations`);
  integrations?.forEach(int => {
    console.log(`  - ${int.provider}: Connected at ${int.connected_at}`);
    console.log(`    Airbyte Source ID: ${int.airbyte_source_id || 'NOT SET'}`);
  });
  
  // 2. Check Airbyte connections
  console.log('\n2️⃣ CHECKING AIRBYTE CONNECTIONS:');
  const { data: airbyteConns } = await supabase
    .from('tenant_airbyte_connections')
    .select('*')
    .eq('tenant_id', tenantId);
  
  console.log(`Found ${airbyteConns?.length || 0} Airbyte connections`);
  airbyteConns?.forEach(conn => {
    console.log(`  - ${conn.provider}: ${conn.status}`);
    console.log(`    Connection ID: ${conn.connection_id}`);
    console.log(`    Created: ${conn.created_at}`);
  });
  
  // 3. Check sample data (initial OAuth data)
  console.log('\n3️⃣ CHECKING SAMPLE DATA:');
  const { data: samples } = await supabase
    .from('tenant_sample_data')
    .select('provider, collected_at')
    .eq('tenant_id', tenantId);
  
  const samplesByProvider = {};
  samples?.forEach(s => {
    samplesByProvider[s.provider] = (samplesByProvider[s.provider] || 0) + 1;
  });
  
  Object.entries(samplesByProvider).forEach(([provider, count]) => {
    console.log(`  - ${provider}: ${count} samples`);
  });
  
  // 4. Check for Airbyte-synced tables
  console.log('\n4️⃣ CHECKING FOR AIRBYTE-SYNCED DATA:');
  const airbyteTables = [
    'opsai_default_github_users',
    'opsai_default_github_repositories',
    'opsai_default_google_users',
    'opsai_default_google_analytics_accounts'
  ];
  
  for (const table of airbyteTables) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (count !== null) {
        console.log(`  ✅ ${table}: ${count} records`);
      }
    } catch (error) {
      console.log(`  ❌ ${table}: Table doesn't exist`);
    }
  }
  
  // 5. Check sync status via API
  console.log('\n5️⃣ CHECKING SYNC STATUS:');
  try {
    const response = await fetch(`http://localhost:7250/api/airbyte/sync-status?tenantId=${tenantId}`);
    const status = await response.json();
    
    if (status.connections) {
      status.connections.forEach(conn => {
        console.log(`  - ${conn.provider}: ${conn.status}`);
        if (conn.lastSync) {
          console.log(`    Last sync: ${conn.lastSync.status} at ${conn.lastSync.startedAt}`);
          console.log(`    Records synced: ${conn.lastSync.recordsSynced}`);
        }
      });
    }
  } catch (error) {
    console.log('  ❌ Could not check sync status (API may be down)');
  }
  
  // 6. Summary
  console.log('\n📊 PIPELINE SUMMARY:');
  console.log(`OAuth Connections: ${integrations?.length || 0}`);
  console.log(`Airbyte Connections: ${airbyteConns?.length || 0}`);
  console.log(`Sample Data Collected: ${samples?.length || 0} records`);
  
  if (airbyteConns?.length === 0) {
    console.log('\n⚠️  NO AIRBYTE CONNECTIONS FOUND!');
    console.log('The system is only collecting sample data during OAuth.');
    console.log('Full data sync is NOT happening.');
  } else {
    console.log('\n✅ Airbyte connections exist - data should be syncing');
  }
}

testFullPipeline().catch(console.error);