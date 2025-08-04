#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function checkOAuthFlow() {
  console.log('🔍 Checking OAuth Flow Status...\n');
  
  // 1. Check tenant integrations
  const { data: integrations, error: intError } = await supabase
    .from('tenant_integrations')
    .select('*')
    .eq('tenant_id', 'default')
    .order('connected_at', { ascending: false });
  
  if (intError) {
    console.error('Error fetching integrations:', intError);
    return;
  }
  
  console.log('📋 Connected Integrations:');
  integrations.forEach(int => {
    console.log(`  - ${int.provider}: ${int.status} (Connected: ${new Date(int.connected_at).toLocaleString()})`);
  });
  
  // 2. Check sample data
  console.log('\n📊 Sample Data Collection:');
  const { data: sampleData, error: sampleError } = await supabase
    .from('tenant_sample_data')
    .select('tenant_id, provider, collected_at, sample_data')
    .eq('tenant_id', 'default')
    .order('collected_at', { ascending: false });
  
  if (sampleError) {
    console.error('Error fetching sample data:', sampleError);
    return;
  }
  
  sampleData.forEach(record => {
    const entities = record.sample_data?.entities ? Object.keys(record.sample_data.entities) : [];
    const metrics = record.sample_data?.metrics || {};
    console.log(`  - ${record.provider}:`);
    console.log(`    Collected: ${new Date(record.collected_at).toLocaleString()}`);
    console.log(`    Entities: ${entities.join(', ')}`);
    console.log(`    Metrics:`, metrics);
  });
  
  // 3. Check organized data schemas
  console.log('\n🗄️ Database Organization:');
  const { data: schemas, error: schemaError } = await supabase
    .from('tenant_data_schemas')
    .select('*')
    .eq('tenant_id', 'default')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (schemaError) {
    console.error('Error fetching schemas:', schemaError);
    return;
  }
  
  if (schemas?.length > 0) {
    const schema = schemas[0];
    console.log(`  Schema Created: ${new Date(schema.created_at).toLocaleString()}`);
    console.log(`  Providers: ${schema.providers.join(', ')}`);
    console.log(`  Entities:`, Object.keys(schema.entities || {}));
    console.log(`  Relationships:`, schema.relationships?.length || 0);
  } else {
    console.log('  No schemas found - Run "Organize Database" to create one');
  }
  
  // 4. Check dynamic data
  console.log('\n💾 Organized Data:');
  const { data: dynamicData, error: dynamicError } = await supabase
    .from('tenant_dynamic_data')
    .select('entity_type, count')
    .eq('tenant_id', 'default');
  
  if (dynamicError) {
    console.error('Error fetching dynamic data:', dynamicError);
    return;
  }
  
  // Group by entity type
  const entityCounts = {};
  dynamicData.forEach(record => {
    entityCounts[record.entity_type] = (entityCounts[record.entity_type] || 0) + 1;
  });
  
  Object.entries(entityCounts).forEach(([entity, count]) => {
    console.log(`  - ${entity}: ${count} records`);
  });
  
  // 5. Check Airbyte connections (if any)
  console.log('\n🔄 Airbyte Connections:');
  const { data: airbyteConns, error: airbyteError } = await supabase
    .from('tenant_airbyte_connections')
    .select('*')
    .eq('tenant_id', 'default');
  
  if (!airbyteError && airbyteConns?.length > 0) {
    airbyteConns.forEach(conn => {
      console.log(`  - ${conn.provider}: ${conn.status}`);
    });
  } else {
    console.log('  No Airbyte connections (this is OK - sample data works without it)');
  }
  
  console.log('\n✅ Flow Status Summary:');
  console.log('  1. OAuth: ' + (integrations?.length > 0 ? '✓ Connected' : '✗ Not connected'));
  console.log('  2. Sample Data: ' + (sampleData?.length > 0 ? '✓ Collected' : '✗ Not collected'));
  console.log('  3. DB Organization: ' + (schemas?.length > 0 ? '✓ Organized' : '✗ Not organized'));
  console.log('  4. Data Storage: ' + (Object.keys(entityCounts).length > 0 ? '✓ Stored' : '✗ Not stored'));
}

// Run the check
checkOAuthFlow().catch(console.error);