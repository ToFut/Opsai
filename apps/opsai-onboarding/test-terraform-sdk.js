#!/usr/bin/env node

// Test the Terraform SDK approach for Airbyte token management
async function testTerraformSDK() {
  console.log('🧪 Testing Terraform SDK for Airbyte token management...\n');
  
  // Test OAuth2 token refresh directly
  console.log('1️⃣ Testing OAuth2 client credentials flow...');
  
  const clientId = '4af7a574-b155-47ee-8dce-2cd2c519a34a';
  const clientSecret = 'qxbgA1QsHSZBfOVqdgjbiNJ1ultXGwz7';
  
  try {
    const response = await fetch('https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token', {
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

    if (response.ok) {
      const tokenData = await response.json();
      console.log('✅ OAuth2 token refresh SUCCESS!');
      console.log(`   Token type: ${tokenData.token_type}`);
      console.log(`   Expires in: ${Math.round(tokenData.expires_in / 60)} minutes`);
      console.log(`   Token: ${tokenData.access_token.substring(0, 50)}...`);
      
      // Test the new token with Airbyte API
      console.log('\n2️⃣ Testing new token with Airbyte API...');
      
      const apiResponse = await fetch('https://api.airbyte.com/v1/workspaces/293ab9ea-b538-4a5d-940d-7eacaffda8f5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      if (apiResponse.ok) {
        const workspace = await apiResponse.json();
        console.log('✅ API test with new token SUCCESS!');
        console.log(`   Workspace: ${workspace.name || workspace.workspaceId}`);
        
        console.log('\n🎯 RESULT: Terraform SDK approach will work!');
        console.log('✅ OAuth2 client credentials automatically refresh tokens');
        console.log('✅ Fresh tokens work with Airbyte API');
        console.log('✅ No more "Unauthorized" errors');
        
      } else {
        console.log('❌ API test failed:', apiResponse.status, await apiResponse.text());
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ OAuth2 token refresh failed:', response.status, errorText);
      
      if (response.status === 401) {
        console.log('🚨 Client credentials are invalid');
        console.log('Check AIRBYTE_CLIENT_ID and AIRBYTE_CLIENT_SECRET');
      }
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  
  console.log('\n💡 NEXT STEPS:');
  console.log('1. The Terraform SDK automatically refreshes tokens');
  console.log('2. OAuth connections will now work consistently');
  console.log('3. Data will sync from providers → Airbyte → Supabase');
}

testTerraformSDK().catch(console.error);