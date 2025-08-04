#!/usr/bin/env node

async function debugAirbyteSetup() {
  console.log('🔍 Debugging Airbyte setup failure...\n');
  
  const airbyteApiKey = process.env.AIRBYTE_API_KEY || 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ6Z1BPdmhDSC1Ic21OQnhhV3lnLU11dlF6dHJERTBDSEJHZDB2MVh0Vnk0In0.eyJleHAiOjE3NTQzMTI2ODQsImlhdCI6MTc1NDMxMTc4NCwianRpIjoiYTQwY2RlMzktMjJhMi00YjkzLThjYzgtMmQ3ZGZmNWI3M2Y5IiwiaXNzIjoiaHR0cHM6Ly9jbG91ZC5haXJieXRlLmNvbS9hdXRoL3JlYWxtcy9fYWlyYnl0ZS1hcHBsaWNhdGlvbi1jbGllbnRzIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjU3NjRjODkyLTMxM2MtNGJmNS04MzQ2LTU1NGZhYjQ2YTMwZSIsInR5cCI6IkJlYXJlciIsImF6cCI6IjRhZjdhNTc0LWIxNTUtNDdlZS04ZGNlLTJjZDJjNTE5YTM0YSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtX2FpcmJ5dGUtYXBwbGljYXRpb24tY2xpZW50cyJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJjbGllbnRIb3N0IjoiMTcyLjIzLjAuMjM5IiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJ1c2VyX2lkIjoiNTc2NGM4OTItMzEzYy00YmY1LTgzNDYtNTU0ZmFiNDZhMzBlIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic2VydmljZS1hY2NvdW50LTRhZjdhNTc0LWIxNTUtNDdlZS04ZGNlLTJjZDJjNTE5YTM0YSIsImNsaWVudEFkZHJlc3MiOiIxNzIuMjMuMC4yMzkiLCJjbGllbnRfaWQiOiI0YWY3YTU3NC1iMTU1LTQ3ZWUtOGRjZS0yY2QyYzUxOWEzNGEifQ.OxjdpC6RQG8-nSKujQJ4kKW46W_L33mqzb6XuzmnMTx2l_OSVeFUXGUcTRpk6Qn4n2nQlszLLr9v20erLAzdS353Tbalja48K2jAgz8JWd5JGJVvnZHksDCoKsYxx8YT6bxuZxBXbyqjzeahB73EAP1cFii_GMFydt1vgTeV7-NUW-92ZeiUAxq0vnHrkLzxg1BNqU0T837wBZE9n_ZpN5wazldf646gy52nz5lv7mJt7UZ8629d8bSRxV7_KPOiEeRUMqH6bHTMPqXddV0JGnfZ5v347pXCdKVAMvQ5e7KmTW0_0bBelURAG4ttX7rCbwU1kTMmBJXje0I-jjMGnQ';
  const workspaceId = '293ab9ea-b538-4a5d-940d-7eacaffda8f5';
  
  console.log('1️⃣ Testing Airbyte API access...');
  
  try {
    const response = await fetch('https://api.airbyte.com/v1/workspaces/' + workspaceId, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airbyteApiKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const workspace = await response.json();
      console.log('✅ Airbyte API access working');
      console.log(`   Workspace: ${workspace.name || workspace.workspaceId}`);
    } else {
      const errorText = await response.text();
      console.log('❌ Airbyte API access failed:', response.status, errorText);
      
      if (response.status === 401) {
        console.log('🚨 API key is expired or invalid');
        return;
      }
    }
  } catch (error) {
    console.log('❌ Network error accessing Airbyte:', error.message);
    return;
  }
  
  console.log('\n2️⃣ Testing destination creation...');
  
  const destinationName = 'test_supabase_destination';
  
  try {
    const destinationResponse = await fetch('https://api.airbyte.com/v1/destinations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airbyteApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        destinationDefinitionId: '25c5221d-dce2-4163-ade9-739ef790f503', // Postgres destination
        workspaceId: workspaceId,
        name: destinationName,
        connectionConfiguration: {
          host: 'aws-0-us-west-1.pooler.supabase.com',
          port: 5432,
          database: 'postgres',
          schema: 'public',
          username: 'postgres.dqmufpexuuvlulpilirt',
          password: 'UbGy4kW9RFJ2LFDV',
          ssl_mode: { mode: 'require' }
        }
      })
    });
    
    if (destinationResponse.ok) {
      const destination = await destinationResponse.json();
      console.log('✅ Destination creation test passed');
      console.log(`   Destination ID: ${destination.destinationId}`);
      
      // Clean up test destination
      try {
        await fetch(`https://api.airbyte.com/v1/destinations/${destination.destinationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${airbyteApiKey}`
          }
        });
        console.log('🧹 Test destination cleaned up');
      } catch (e) {
        console.log('⚠️ Could not clean up test destination');
      }
      
    } else {
      const errorText = await destinationResponse.text();
      console.log('❌ Destination creation failed:', destinationResponse.status);
      console.log('   Error:', errorText);
      
      // Try to parse the error
      try {
        const errorJson = JSON.parse(errorText);
        console.log('   Detailed error:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Error text is not JSON
      }
    }
  } catch (error) {
    console.log('❌ Destination creation error:', error.message);
  }
  
  console.log('\n3️⃣ Testing connection creation...');
  
  const existingSourceId = '7c0ee77f-488d-4ff3-b67e-3bcad9151a9b'; // GitHub source
  
  try {
    // First check if source exists
    const sourceResponse = await fetch(`https://api.airbyte.com/v1/sources/${existingSourceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airbyteApiKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (sourceResponse.ok) {
      console.log('✅ GitHub source exists and is accessible');
    } else {
      console.log('❌ GitHub source not found or not accessible');
      console.log('   Status:', sourceResponse.status);
      console.log('   This might be why connections fail');
    }
  } catch (error) {
    console.log('❌ Source check error:', error.message);
  }
  
  console.log('\n💡 DIAGNOSIS:');
  console.log('If API access works but destination/connection fails:');
  console.log('1. Check Supabase credentials in environment');
  console.log('2. Verify source IDs are correct');
  console.log('3. Check if sources have proper configurations');
  console.log('4. May need to use different destination configuration');
}

debugAirbyteSetup().catch(console.error);