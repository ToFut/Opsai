#!/usr/bin/env node

async function getAirbyteToken() {
  const response = await fetch('https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: '4af7a574-b155-47ee-8dce-2cd2c519a34a',
      client_secret: 'qxbgA1QsHSZBfOVqdgjbiNJ1ultXGwz7',
      scope: 'openid email profile'
    })
  });

  const data = await response.json();
  return data.access_token;
}

async function checkAirbyteResources() {
  console.log('🔍 Checking Airbyte Workspace Resources...\n');
  
  try {
    const token = await getAirbyteToken();
    console.log('✅ Got authentication token\n');
    
    // Get sources
    console.log('📋 SOURCES:');
    const sourcesResponse = await fetch('https://api.airbyte.com/v1/sources', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    const sources = await sourcesResponse.json();
    
    if (sources.data) {
      sources.data.forEach(source => {
        console.log(`  - ${source.name} (${source.sourceId})`);
        console.log(`    Type: ${source.sourceType || 'Unknown'}`);
      });
    }
    
    // Get destinations
    console.log('\n📋 DESTINATIONS:');
    const destResponse = await fetch('https://api.airbyte.com/v1/destinations', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    const destinations = await destResponse.json();
    
    if (destinations.data) {
      destinations.data.forEach(dest => {
        console.log(`  - ${dest.name} (${dest.destinationId})`);
        console.log(`    Type: ${dest.destinationType || 'Unknown'}`);
      });
    }
    
    // Get connections
    console.log('\n📋 CONNECTIONS:');
    const connResponse = await fetch('https://api.airbyte.com/v1/connections', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    const connections = await connResponse.json();
    
    if (connections.data) {
      connections.data.forEach(conn => {
        console.log(`  - ${conn.name} (${conn.connectionId})`);
        console.log(`    Status: ${conn.status}`);
        console.log(`    Schedule: ${conn.schedule?.scheduleType || 'manual'}`);
        console.log(`    Source → Destination: ${conn.sourceId} → ${conn.destinationId}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAirbyteResources().catch(console.error);