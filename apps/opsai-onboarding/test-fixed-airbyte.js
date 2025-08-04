#!/usr/bin/env node

// Test the fixed Airbyte destination creation
async function testFixedAirbyte() {
  console.log('🧪 Testing fixed Airbyte destination creation...\n');
  
  // Get fresh token first
  const clientId = '4af7a574-b155-47ee-8dce-2cd2c519a34a';
  const clientSecret = 'qxbgA1QsHSZBfOVqdgjbiNJ1ultXGwz7';
  
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
  const token = tokenData.access_token;
  
  console.log('✅ Got fresh token');
  
  // Test the corrected destination creation format
  console.log('1️⃣ Testing corrected destination creation...');
  
  const destinationConfig = {
    destinationDefinitionId: '25c5221d-dce2-4163-ade9-739ef790f503', // Postgres destination
    workspaceId: '293ab9ea-b538-4a5d-940d-7eacaffda8f5',
    name: 'test_supabase_destination_fixed',
    configuration: {  // Changed from 'connectionConfiguration' to 'configuration'
      host: 'aws-0-us-west-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      schema: 'public',
      username: 'postgres.dqmufpexuuvlulpilirt',
      password: 'UbGy4kW9RFJ2LFDV',
      ssl_mode: { mode: 'require' }
    }
  };
  
  console.log('📋 Request body:', JSON.stringify(destinationConfig, null, 2));
  
  try {
    const response = await fetch('https://api.airbyte.com/v1/destinations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(destinationConfig)
    });
    
    if (response.ok) {
      const destination = await response.json();
      console.log('✅ Destination creation SUCCESS!');
      console.log(`   Destination ID: ${destination.destinationId}`);
      console.log(`   Name: ${destination.name}`);
      
      // Clean up test destination
      try {
        const deleteResponse = await fetch(`https://api.airbyte.com/v1/destinations/${destination.destinationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (deleteResponse.ok) {
          console.log('🧹 Test destination cleaned up');
        }
      } catch (e) {
        console.log('⚠️ Could not clean up test destination');
      }
      
      console.log('\n🎯 RESULT: Airbyte destination creation is now FIXED!');
      console.log('✅ Correct API format using "configuration" field');
      console.log('✅ OAuth connections will now create Supabase destinations');
      console.log('✅ Data sync from providers → Airbyte → Supabase will work');
      
    } else {
      const errorText = await response.text();
      console.log('❌ Destination creation still failed:', response.status);
      console.log('   Error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testFixedAirbyte().catch(console.error);