#!/usr/bin/env node

// Direct Airbyte API test to create connections
const AIRBYTE_API_URL = 'https://api.airbyte.com/v1';
const AIRBYTE_CLIENT_ID = '4af7a574-b155-47ee-8dce-2cd2c519a34a';
const AIRBYTE_CLIENT_SECRET = 'qxbgA1QsHSZBfOVqdgjbiNJ1ultXGwz7';
const AIRBYTE_WORKSPACE_ID = '293ab9ea-b538-4a5d-940d-7eacaffda8f5';

async function getAirbyteToken() {
  const response = await fetch('https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AIRBYTE_CLIENT_ID,
      client_secret: AIRBYTE_CLIENT_SECRET,
      scope: 'openid email profile'
    })
  });

  const data = await response.json();
  return data.access_token;
}

async function createAirbyteConnection() {
  console.log('🚀 CREATING DIRECT AIRBYTE CONNECTION\n');
  
  try {
    const token = await getAirbyteToken();
    console.log('✅ Got authentication token\n');
    
    // Use existing source and destination IDs
    const sourceId = '7c0ee77f-488d-4ff3-b67e-3bcad9151a9b'; // opsai-github-dev
    const destinationId = '76aa05f9-5ec1-4c71-8f32-e472d441d532'; // opsai-supabase-dev
    
    console.log('📋 Creating connection:');
    console.log(`  Source: GitHub (${sourceId})`);
    console.log(`  Destination: Supabase (${destinationId})\n`);
    
    // Create connection with minimal config (like working Stripe connection)
    const connectionBody = {
      name: 'test_github_to_supabase_minimal',
      sourceId: sourceId,
      destinationId: destinationId,
      configurations: {
        namespaceDefinition: 'destination',
        namespaceFormat: '${SOURCE_NAMESPACE}',
        prefix: 'opsai_github_'
      },
      schedule: {
        scheduleType: 'manual'
      }
    };
    
    console.log('📡 Sending connection request...');
    const connResponse = await fetch(`${AIRBYTE_API_URL}/connections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(connectionBody)
    });
    
    console.log('Response status:', connResponse.status);
    const result = await connResponse.text();
    console.log('Response:', result);
    
    if (connResponse.ok) {
      const connection = JSON.parse(result);
      console.log('\n✅ CONNECTION CREATED SUCCESSFULLY!');
      console.log('Connection ID:', connection.connectionId);
      console.log('Status:', connection.status);
      
      // Trigger initial sync
      console.log('\n🔄 Triggering initial sync...');
      const syncResponse = await fetch(`${AIRBYTE_API_URL}/connections/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connectionId: connection.connectionId,
          jobType: 'sync'
        })
      });
      
      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        console.log('✅ Sync triggered! Job ID:', syncResult.jobId);
      } else {
        console.log('⚠️ Could not trigger sync:', await syncResponse.text());
      }
      
      // Store in Supabase
      console.log('\n💾 Storing connection info in Supabase...');
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        'https://dqmufpexuuvlulpilirt.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
      );
      
      const { error } = await supabase
        .from('tenant_airbyte_connections')
        .insert({
          tenant_id: 'test_direct_connection',
          provider: 'github',
          source_id: sourceId,
          destination_id: destinationId,
          connection_id: connection.connectionId,
          status: 'active',
          created_at: new Date().toISOString()
        });
      
      if (!error) {
        console.log('✅ Connection info stored in Supabase!');
      } else {
        console.log('⚠️ Could not store in Supabase:', error);
      }
      
    } else {
      console.log('\n❌ CONNECTION CREATION FAILED');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createAirbyteConnection().catch(console.error);