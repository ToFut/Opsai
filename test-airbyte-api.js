// Test Airbyte API directly
require('dotenv').config({ path: './.env' });

async function testAirbyteAPI() {
  const clientId = process.env.AIRBYTE_CLIENT_ID;
  const clientSecret = process.env.AIRBYTE_CLIENT_SECRET;
  const workspaceId = process.env.AIRBYTE_WORKSPACE_ID;

  console.log('🔍 Testing Airbyte API with credentials:');
  console.log(`   Client ID: ${clientId?.substring(0, 10)}...`);
  console.log(`   Workspace ID: ${workspaceId}`);

  try {
    // 1. Get OAuth token
    console.log('\n1️⃣ Getting OAuth token...');
    const tokenResponse = await fetch('https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'openid email profile'
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('❌ Token request failed:', tokenData);
      return;
    }

    console.log('✅ Got access token, expires in:', tokenData.expires_in, 'seconds');

    // 2. Test API access
    console.log('\n2️⃣ Testing API access...');
    const apiResponse = await fetch(`https://api.airbyte.com/v1/workspaces/${workspaceId}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    const workspaceData = await apiResponse.json();
    
    if (!apiResponse.ok) {
      console.error('❌ API request failed:', workspaceData);
      return;
    }

    console.log('✅ Workspace info:', JSON.stringify(workspaceData, null, 2));

    // 3. Test OAuth initiation endpoint
    console.log('\n3️⃣ Testing OAuth initiation...');
    const oauthTestResponse = await fetch('https://api.airbyte.com/v1/sources/initiateOAuth', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        workspaceId: workspaceId,
        sourceDefinitionId: 'ef69ef6e-aa7f-4af1-a01d-ef775033524e', // GitHub
        redirectUrl: 'https://example.com/callback', // Testing with HTTPS
        oAuthInputConfiguration: {
          repositories: [],
          start_date: '2024-01-01T00:00:00Z'
        }
      })
    });

    const oauthData = await oauthTestResponse.json();
    console.log(`OAuth test response (${oauthTestResponse.status}):`, JSON.stringify(oauthData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAirbyteAPI();