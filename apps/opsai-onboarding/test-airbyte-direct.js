#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

async function testAirbyteDirectly() {
  console.log('🧪 TESTING AIRBYTE SETUP DIRECTLY\n');
  
  // First, insert a test integration so Airbyte setup has something to work with
  console.log('1️⃣ Creating test integration...');
  const { data: integration, error: intError } = await supabase
    .from('tenant_integrations')
    .insert({
      tenant_id: 'test_direct',
      provider: 'github',
      access_token: 'gho_test_token_12345',
      status: 'connected',
      connected_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (intError) {
    console.error('Failed to create test integration:', intError);
    return;
  }
  
  console.log('✅ Test integration created:', integration.id);
  
  // Now test the Airbyte setup
  console.log('\n2️⃣ Testing Airbyte setup API...');
  try {
    const response = await fetch('http://localhost:7250/api/airbyte/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenantId: 'test_direct',
        provider: 'github'
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    // Check if connection was created
    if (result.success) {
      console.log('\n✅ AIRBYTE CONNECTION CREATED!');
      console.log('Connection ID:', result.connectionId);
      console.log('Source ID:', result.sourceId);
      console.log('Schedule:', result.syncSchedule);
      
      // Check tenant_airbyte_connections table
      const { data: airbyteConn } = await supabase
        .from('tenant_airbyte_connections')
        .select('*')
        .eq('tenant_id', 'test_direct')
        .single();
      
      if (airbyteConn) {
        console.log('\n✅ Connection stored in database:', airbyteConn);
      }
    } else {
      console.log('\n❌ AIRBYTE SETUP FAILED');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
    }
    
  } catch (error) {
    console.error('Request failed:', error);
  }
  
  // Clean up
  console.log('\n3️⃣ Cleaning up test data...');
  await supabase
    .from('tenant_integrations')
    .delete()
    .eq('tenant_id', 'test_direct');
  
  await supabase
    .from('tenant_airbyte_connections')
    .delete()
    .eq('tenant_id', 'test_direct');
  
  console.log('✅ Cleanup complete');
}

testAirbyteDirectly().catch(console.error);