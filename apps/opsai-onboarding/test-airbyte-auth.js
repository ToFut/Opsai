#!/usr/bin/env node

require('dotenv').config();

async function testWithApiKey(apiKey, apiUrl) {
  try {
    console.log('\n2️⃣ Testing API access with direct key...');
    const workspacesResponse = await fetch(`${apiUrl}/workspaces`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    const workspacesData = await workspacesResponse.json();
    console.log('Workspaces response:', JSON.stringify(workspacesData, null, 2));

    if (workspacesResponse.ok && workspacesData.data) {
      console.log(`\n✅ API Key authentication successful! Found ${workspacesData.data.length} workspaces`);
      
      // List sources for the first workspace
      if (workspacesData.data.length > 0) {
        const workspaceId = workspacesData.data[0].workspaceId;
        console.log(`\n3️⃣ Checking sources for workspace ${workspaceId}...`);
        
        const sourcesResponse = await fetch(`${apiUrl}/sources?workspaceId=${workspaceId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });
        
        const sourcesData = await sourcesResponse.json();
        console.log(`Found ${sourcesData.data?.length || 0} sources:`);
        sourcesData.data?.forEach(s => {
          console.log(`  - ${s.name} (${s.sourceId}) - Type: ${s.sourceType}`);
        });

        // List destinations
        console.log(`\n4️⃣ Checking destinations for workspace ${workspaceId}...`);
        
        const destResponse = await fetch(`${apiUrl}/destinations?workspaceId=${workspaceId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });
        
        const destData = await destResponse.json();
        console.log(`Found ${destData.data?.length || 0} destinations:`);
        destData.data?.forEach(d => {
          console.log(`  - ${d.name} (${d.destinationId}) - Type: ${d.destinationType}`);
        });
      }
    } else {
      console.log('❌ API Key authentication failed');
    }
  } catch (error) {
    console.error('Error with API key:', error.message);
  }
}

async function testAirbyteAuth() {
  console.log('🔍 Testing Airbyte Authentication\n');

  const AIRBYTE_CLIENT_ID = process.env.AIRBYTE_CLIENT_ID;
  const AIRBYTE_CLIENT_SECRET = process.env.AIRBYTE_CLIENT_SECRET;
  const AIRBYTE_API_KEY = process.env.AIRBYTE_API_KEY;
  const AIRBYTE_API_URL = 'https://api.airbyte.com/v1';

  console.log('Client ID:', AIRBYTE_CLIENT_ID);
  console.log('Client Secret:', AIRBYTE_CLIENT_SECRET ? '***' + AIRBYTE_CLIENT_SECRET.slice(-4) : 'NOT SET');
  console.log('API Key:', AIRBYTE_API_KEY ? '***' + AIRBYTE_API_KEY.slice(-20) : 'NOT SET');

  try {
    // 1. Get access token using client credentials
    console.log('\n1️⃣ Getting access token...');
    const tokenResponse = await fetch('https://api.airbyte.com/v1/applications/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AIRBYTE_CLIENT_ID,
        client_secret: AIRBYTE_CLIENT_SECRET
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.log('❌ Failed to get token:', tokenData);
      
      // Try with direct API key if we have one
      if (AIRBYTE_API_KEY) {
        console.log('\n🔄 Trying with direct API key...');
        await testWithApiKey(AIRBYTE_API_KEY, AIRBYTE_API_URL);
      }
      return;
    }

    console.log('✅ Got access token!');
    const accessToken = tokenData.access_token;

    // 2. Test API with token
    console.log('\n2️⃣ Testing API access...');
    const workspacesResponse = await fetch(`${AIRBYTE_API_URL}/workspaces`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    const workspacesData = await workspacesResponse.json();
    console.log('Workspaces response:', JSON.stringify(workspacesData, null, 2));

    if (workspacesResponse.ok && workspacesData.data) {
      console.log(`\n✅ Authentication successful! Found ${workspacesData.data.length} workspaces`);
      
      // List sources for the first workspace
      if (workspacesData.data.length > 0) {
        const workspaceId = workspacesData.data[0].workspaceId;
        console.log(`\n3️⃣ Checking sources for workspace ${workspaceId}...`);
        
        const sourcesResponse = await fetch(`${AIRBYTE_API_URL}/sources?workspaceId=${workspaceId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });
        
        const sourcesData = await sourcesResponse.json();
        console.log(`Found ${sourcesData.data?.length || 0} sources`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAirbyteAuth();