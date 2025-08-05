#!/usr/bin/env node

const AIRBYTE_API_URL = 'https://api.airbyte.com/v1';
const AIRBYTE_CLIENT_ID = '4af7a574-b155-47ee-8dce-2cd2c519a34a';
const AIRBYTE_CLIENT_SECRET = 'qxbgA1QsHSZBfOVqdgjbiNJ1ultXGwz7';

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

async function verifyGitHubSource() {
  console.log('🔍 VERIFYING GITHUB SOURCE\n');
  
  try {
    const token = await getAirbyteToken();
    const sourceId = '7c0ee77f-488d-4ff3-b67e-3bcad9151a9b';
    
    // Get source details
    const sourceResponse = await fetch(`${AIRBYTE_API_URL}/sources/${sourceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (sourceResponse.ok) {
      const source = await sourceResponse.json();
      console.log('📋 Source Details:');
      console.log('  Name:', source.name);
      console.log('  Type:', source.sourceType);
      console.log('  Created:', source.createdAt);
      console.log('  Configuration:', JSON.stringify(source.configuration, null, 2));
    } else {
      console.log('❌ Could not fetch source:', await sourceResponse.text());
    }
    
    // Try to discover schema
    console.log('\n🔍 Discovering schema...');
    const schemaResponse = await fetch(`${AIRBYTE_API_URL}/sources/discover_schema`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceId: sourceId,
        disableCache: true
      })
    });
    
    if (schemaResponse.ok) {
      const schema = await schemaResponse.json();
      console.log('✅ Schema discovered successfully!');
      console.log('  Streams:', schema.catalog?.streams?.map(s => s.stream?.name).join(', '));
    } else {
      console.log('❌ Schema discovery failed:', await schemaResponse.text());
    }
    
    // Check connection health
    console.log('\n🏥 Checking source health...');
    const healthResponse = await fetch(`${AIRBYTE_API_URL}/sources/check_connection`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceId: sourceId
      })
    });
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('  Status:', health.status);
      if (health.message) console.log('  Message:', health.message);
    } else {
      console.log('❌ Health check failed:', await healthResponse.text());
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyGitHubSource().catch(console.error);