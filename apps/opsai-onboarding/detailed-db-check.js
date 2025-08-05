#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function detailedDbCheck() {
  console.log('🔍 DETAILED SUPABASE DATABASE CHECK\n');
  
  // Check integrations by provider
  console.log('📊 TENANT_INTEGRATIONS BREAKDOWN:');
  const { data: integrations } = await supabase
    .from('tenant_integrations')
    .select('provider, status, connected_at')
    .eq('tenant_id', 'default');
  
  const providerCounts = {};
  integrations?.forEach(int => {
    providerCounts[int.provider] = (providerCounts[int.provider] || 0) + 1;
  });
  
  Object.entries(providerCounts).forEach(([provider, count]) => {
    console.log(`  - ${provider}: ${count} records`);
  });
  
  // Check sample data by provider
  console.log('\n📋 TENANT_SAMPLE_DATA BREAKDOWN:');
  const { data: sampleData } = await supabase
    .from('tenant_sample_data')
    .select('provider, collected_at, sample_data')
    .eq('tenant_id', 'default');
  
  const sampleProviderCounts = {};
  sampleData?.forEach(sample => {
    sampleProviderCounts[sample.provider] = (sampleProviderCounts[sample.provider] || 0) + 1;
  });
  
  Object.entries(sampleProviderCounts).forEach(([provider, count]) => {
    console.log(`  - ${provider}: ${count} records`);
  });
  
  // Show latest sample data structure
  if (sampleData?.length > 0) {
    console.log('\n📝 LATEST SAMPLE DATA STRUCTURE:');
    const latest = sampleData[sampleData.length - 1];
    console.log(`Provider: ${latest.provider}`);
    console.log(`Collected: ${latest.collected_at}`);
    if (latest.sample_data?.entities) {
      console.log('Entities:', Object.keys(latest.sample_data.entities));
    }
  }
  
  // Check schemas
  console.log('\n🗄️ TENANT_DATA_SCHEMAS BREAKDOWN:');
  const { data: schemas } = await supabase
    .from('tenant_data_schemas')
    .select('id, providers, entities, created_at')
    .eq('tenant_id', 'default')
    .order('created_at', { ascending: false })
    .limit(5);
  
  schemas?.forEach(schema => {
    console.log(`  Schema #${schema.id}:`);
    console.log(`    Providers: ${schema.providers?.join(', ')}`);
    console.log(`    Entities: ${Object.keys(schema.entities || {}).join(', ')}`);
    console.log(`    Created: ${schema.created_at}`);
    console.log('');
  });
  
  // Check for any recent activity
  console.log('⏰ RECENT ACTIVITY (last 10 minutes):');
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  
  const { data: recentIntegrations } = await supabase
    .from('tenant_integrations')
    .select('provider, connected_at')
    .gte('connected_at', tenMinutesAgo);
  
  const { data: recentSamples } = await supabase
    .from('tenant_sample_data')
    .select('provider, collected_at')
    .gte('collected_at', tenMinutesAgo);
    
  const { data: recentSchemas } = await supabase
    .from('tenant_data_schemas')
    .select('id, created_at')
    .gte('created_at', tenMinutesAgo);
  
  console.log(`  - New integrations: ${recentIntegrations?.length || 0}`);
  console.log(`  - New sample data: ${recentSamples?.length || 0}`);
  console.log(`  - New schemas: ${recentSchemas?.length || 0}`);
}

detailedDbCheck().catch(console.error);