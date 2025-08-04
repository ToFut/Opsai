// Test OAuth configuration
const { airbyteClient } = require('./apps/opsai-onboarding/lib/airbyte-oauth-client.ts')

async function testOAuthFlow() {
  try {
    console.log('🧪 Testing GitHub OAuth flow...')
    
    const sourceDefinitionId = 'ef69ef6e-aa7f-4af1-a01d-ef775033524e' // GitHub
    const redirectUri = 'http://localhost:7250/api/oauth/callback'
    const oAuthInputConfiguration = {
      repositories: [],
      start_date: '2024-08-04T00:00:00Z'
    }
    
    const consentUrl = await airbyteClient.createOAuthConsentUrl(
      sourceDefinitionId,
      redirectUri,
      oAuthInputConfiguration
    )
    
    console.log('✅ OAuth consent URL created:', consentUrl)
    
  } catch (error) {
    console.error('❌ OAuth test failed:', error.message)
    
    // Test fallback OAuth
    console.log('🔄 Testing fallback OAuth...')
    
    const clientId = process.env.GITHUB_CLIENT_ID || 'your-github-oauth-app-client-id'
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || 'your-github-oauth-app-client-secret'
    
    if (clientId === 'your-github-oauth-app-client-id') {
      console.log('❌ GitHub OAuth credentials not configured')
      console.log('Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your .env file')
      return
    }
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: 'http://localhost:7250/api/oauth/callback',
      response_type: 'code',
      scope: 'repo user read:org',
      state: Buffer.from(JSON.stringify({
        tenantId: 'test-tenant',
        provider: 'github',
        timestamp: Date.now(),
        popup: true
      })).toString('base64'),
      access_type: 'offline',
      prompt: 'consent'
    })
    
    const fallbackUrl = `https://github.com/login/oauth/authorize?${params.toString()}`
    console.log('✅ Fallback OAuth URL:', fallbackUrl)
  }
}

testOAuthFlow()