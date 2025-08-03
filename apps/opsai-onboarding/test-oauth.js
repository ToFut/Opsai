// Test OAuth API behavior
async function testOAuthFlow() {
  const providers = ['google-analytics', 'shopify', 'stripe', 'salesforce', 'hubspot'];
  
  for (const provider of providers) {
    console.log(`\n🔗 Testing ${provider} OAuth flow:`);
    
    try {
      const response = await fetch('http://localhost:7250/api/oauth/create-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          tenantId: 'test-tenant-123',
          redirectUri: 'http://localhost:7250/oauth-success'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success:`, data);
        if (data.oauthUrl) {
          console.log(`🌐 Would redirect to: ${data.oauthUrl}`);
        }
      } else {
        const error = await response.json();
        console.log(`⚠️ Error (${response.status}):`, error);
        if (error.setupInstructions) {
          console.log(`📋 Setup instructions:`, error.setupInstructions);
        }
      }
    } catch (err) {
      console.log(`❌ Request failed:`, err.message);
    }
  }
}

testOAuthFlow();