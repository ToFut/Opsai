/**
 * Test script for Airbyte OAuth Client using Client Credentials
 */

// Mock environment variables for testing
process.env.AIRBYTE_CLIENT_ID = '4af7a574-b155-47ee-8dce-2cd2c519a34a'
process.env.AIRBYTE_CLIENT_SECRET = 'qxbgA1QsHSZBfOVqdgjbiNJ1ultXGwz7'
process.env.AIRBYTE_WORKSPACE_ID = '293ab9ea-b538-4a5d-940d-7eacaffda8f5'
process.env.AIRBYTE_API_URL = 'https://api.airbyte.com/v1'

async function testAirbyteOAuth() {
  console.log('🧪 Testing Airbyte OAuth Client with Client Credentials...')
  
  try {
    // Import the client (this will test the basic initialization)
    const { airbyteClient, AIRBYTE_SOURCE_DEFINITIONS } = require('./lib/airbyte-oauth-client.ts')
    
    console.log('✅ Airbyte client initialized successfully')
    console.log('📋 Available source definitions:', Object.keys(AIRBYTE_SOURCE_DEFINITIONS))
    
    // Test OAuth consent URL creation for GitHub
    const provider = 'github'
    const sourceDefinitionId = AIRBYTE_SOURCE_DEFINITIONS[provider]
    
    if (sourceDefinitionId && sourceDefinitionId !== 'not-supported-by-airbyte') {
      console.log(`\n🚀 Testing OAuth consent URL for ${provider}...`)
      console.log(`📋 Source Definition ID: ${sourceDefinitionId}`)
      
      const redirectUri = 'http://localhost:7250/api/oauth/callback'
      const oauthConfig = {
        repositories: ['test-repo'],
        start_date: '2024-01-01T00:00:00Z'
      }
      
      console.log('📤 Creating OAuth consent URL...')
      console.log('⚙️ Config:', { sourceDefinitionId, redirectUri, oauthConfig })
      
      // This will test the client credentials flow
      const consentUrl = await airbyteClient.createOAuthConsentUrl(
        sourceDefinitionId,
        redirectUri,
        oauthConfig
      )
      
      console.log('✅ OAuth consent URL created successfully!')
      console.log('🔗 Consent URL:', consentUrl)
      
    } else {
      console.log(`⚠️ ${provider} not supported by Airbyte`)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testAirbyteOAuth()
  .then(() => {
    console.log('\n🎉 Test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Test crashed:', error)
    process.exit(1)
  })