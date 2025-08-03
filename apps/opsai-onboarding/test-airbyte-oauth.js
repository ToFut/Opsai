// Test real Airbyte OAuth URL creation
async function testAirbyteOAuth() {
  console.log('🚀 Testing Real Airbyte OAuth Flow');
  console.log('==================================');
  
  const provider = 'google-analytics';
  const tenantId = 'test-tenant-' + Date.now();
  const redirectUri = 'http://localhost:7250/oauth-success';
  
  console.log(`📊 Provider: ${provider}`);
  console.log(`👤 Tenant ID: ${tenantId}`);
  console.log(`🔄 Redirect URI: ${redirectUri}`);
  
  try {
    console.log('\n🔗 Making OAuth URL request...');
    
    const response = await fetch('http://localhost:7250/api/oauth/create-url', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        provider,
        tenantId,
        redirectUri
      })
    });
    
    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log(`📦 Response data:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.oauthUrl) {
      console.log('\n✅ SUCCESS! OAuth URL generated');
      console.log(`🌐 OAuth URL: ${data.oauthUrl}`);
      console.log(`📋 Source: ${data.source}`);
      console.log('\n🖱️ You can now open this URL to test the login flow:');
      console.log(`   ${data.oauthUrl}`);
      
      // Try to open the URL automatically
      const { spawn } = require('child_process');
      try {
        spawn('open', [data.oauthUrl], { stdio: 'ignore' });
        console.log('🚀 Attempting to open OAuth URL in browser...');
      } catch (e) {
        console.log('⚠️ Could not auto-open browser, please copy the URL above');
      }
      
    } else {
      console.log('\n❌ OAuth URL generation failed');
      console.log(`💬 Error: ${data.error}`);
      if (data.setupInstructions) {
        console.log('📋 Setup instructions:', data.setupInstructions);
      }
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testAirbyteOAuth();