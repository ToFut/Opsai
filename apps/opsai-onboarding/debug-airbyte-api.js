// Debug Airbyte API endpoints
const AIRBYTE_API_URL = 'https://api.airbyte.com/v1'
const AIRBYTE_API_KEY = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ6Z1BPdmhDSC1Ic21OQnhhV3lnLU11dlF6dHJERTBDSEJHZDB2MVh0Vnk0In0.eyJleHAiOjE3NTQwNzYxMjMsImlhdCI6MTc1NDA3NTIyMywianRpIjoiNDlhYjRkZDItZDkwMC00MmU5LWE1MmYtY2M1MTAxZGRhYTlkIiwiaXNzIjoiaHR0cHM6Ly9jbG91ZC5haXJieXRlLmNvbS9hdXRoL3JlYWxtcy9fYWlyYnl0ZS1hcHBsaWNhdGlvbi1jbGllbnRzIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjU3NjRjODkyLTMxM2MtNGJmNS04MzQ2LTU1NGZhYjQ2YTMwZSIsInR5cCI6IkJlYXJlciIsImF6cCI6IjRhZjdhNTc0LWIxNTUtNDdlZS04ZGNlLTJjZDJjNTE5YTM0YSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtX2FpcmJ5dGUtYXBwbGljYXRpb24tY2xpZW50cyJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJjbGllbnRIb3N0IjoiMTcyLjIzLjEuMjQxIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJ1c2VyX2lkIjoiNTc2NGM4OTItMzEzYy00YmY1LTgzNDYtNTU0ZmFiNDZhMzBlIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic2VydmljZS1hY2NvdW50LTRhZjdhNTc0LWIxNTUtNDdlZS04ZGNlLTJjZDJjNTE5YTM0YSIsImNsaWVudEFkZHJlc3MiOiIxNzIuMjMuMS4yNDEiLCJjbGllbnRfaWQiOiI0YWY3YTU3NC1iMTU1LTQ3ZWUtOGRjZS0yY2QyYzUxOWEzNGEifQ.l0JpTWb2FCqL8BMoEX7rQBzaS25xqHNi51titMLdqLCYUNaFxNBgmXkNCDaH8RxIwMzk83CAvt9VNT2VTJD5w_1FR7OxiRRkHO9dwXYb4A0xpeVPrgDXorVUpA8bkrhMve9SGEAYj-S7clsvUWPyB50-ff4_S94cADv7PLC08AUa4-pNyKegyg3A1CIZYPw1kt4HldOHVPFLYyekdOl3PEnIILTmR89uOoY9tEm308DzsDM_-XVd_qWlzPqF74ao3zVNpTN6dghMOCEhZ4jZHs_kk19IxZvrZyoBxyS2w5L0M2sy4YUZHpeK1bCRk7rn0sPJkLk4aH9x-vp4ja3ERQ'
const AIRBYTE_WORKSPACE_ID = '293ab9ea-b538-4a5d-940d-7eacaffda8f5'

async function debugAirbyteAPI() {
  console.log('🔍 Debugging Airbyte API endpoints')
  console.log('===================================')
  
  const headers = {
    'Authorization': `Bearer ${AIRBYTE_API_KEY}`,
    'Accept': 'application/json',
    'User-Agent': 'OpsAI-Platform/1.0'
  }
  
  // Test 1: List available source definitions
  console.log('\n📋 Test 1: List source definitions')
  try {
    const response = await fetch(`${AIRBYTE_API_URL}/source_definitions`, {
      headers
    })
    
    console.log(`Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log(`Found ${data.data?.length || 0} source definitions`)
      
      // Look for Google Analytics connectors
      const gaConnectors = data.data?.filter(def => 
        def.name.toLowerCase().includes('google') && 
        def.name.toLowerCase().includes('analytics')
      )
      
      console.log('\n🔍 Google Analytics connectors:')
      gaConnectors?.forEach(connector => {
        console.log(`  - ${connector.name} (${connector.sourceDefinitionId})`)
        console.log(`    OAuth supported: ${connector.supportedDestinationSyncModes?.includes('oauth') ? 'Yes' : 'Unknown'}`)
      })
      
      // Look for Shopify connectors
      const shopifyConnectors = data.data?.filter(def => 
        def.name.toLowerCase().includes('shopify')
      )
      
      console.log('\n🛍️ Shopify connectors:')
      shopifyConnectors?.forEach(connector => {
        console.log(`  - ${connector.name} (${connector.sourceDefinitionId})`)
      })
      
    } else {
      console.log(`Error: ${await response.text()}`)
    }
  } catch (error) {
    console.log(`Failed: ${error.message}`)
  }
  
  // Test 2: Check correct OAuth endpoint
  console.log('\n🔐 Test 2: Check OAuth endpoints')
  const oauthEndpoints = [
    '/sources/oAuth/consent_url',
    '/oauth/consent_url', 
    '/source_definitions/oauth/consent_url',
    '/v1/sources/oauth/consent_url'
  ]
  
  for (const endpoint of oauthEndpoints) {
    try {
      const testUrl = `${AIRBYTE_API_URL}${endpoint}`
      console.log(`\nTesting: ${testUrl}`)
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId: AIRBYTE_WORKSPACE_ID,
          sourceDefinitionId: '3cc2ebd2-a319-477e-8dd5-4a2db3ac6e4c',
          redirectUri: 'http://localhost:7250/oauth-success',
          oAuthInputConfiguration: {}
        })
      })
      
      console.log(`  Status: ${response.status}`)
      if (response.status !== 404) {
        const text = await response.text()
        console.log(`  Response: ${text.substring(0, 200)}...`)
      }
      
    } catch (error) {
      console.log(`  Error: ${error.message}`)
    }
  }
}

debugAirbyteAPI()