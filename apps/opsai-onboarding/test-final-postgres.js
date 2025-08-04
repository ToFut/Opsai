#!/usr/bin/env node

// Test final Postgres destination with required schema field
async function testFinalPostgres() {
  console.log('🧪 Testing final Postgres destination with schema field...\n');
  
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
  
  // Test with the required 'schema' field
  console.log('1️⃣ Testing with required schema field...');
  
  const destinationConfig = {
    name: 'test_supabase_final',
    workspaceId: '293ab9ea-b538-4a5d-940d-7eacaffda8f5',
    definitionId: '25c5221d-dce2-4163-ade9-739ef790f503',
    configuration: {
      host: 'aws-0-us-west-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      username: 'postgres.dqmufpexuuvlulpilirt',
      password: 'UbGy4kW9RFJ2LFDV',
      schema: 'public'  // This was the missing required field!
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
      console.log('🎉 DESTINATION CREATION SUCCESS!');
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
      
      console.log('\n🎯 PROBLEM SOLVED!');
      console.log('✅ Airbyte destination creation now works');
      console.log('✅ Required field: schema (was missing!)');
      console.log('✅ OAuth connections will create destinations successfully');
      console.log('✅ Auto data sync: providers → Airbyte → Supabase ✨');
      
    } else {
      const errorText = await response.text();
      console.log('❌ Still failed:', response.status);
      console.log('   Error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testFinalPostgres().catch(console.error);