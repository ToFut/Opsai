// Test Airbyte API directly
const AIRBYTE_API_URL = 'https://api.airbyte.com/v1'
const AIRBYTE_API_KEY = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ6Z1BPdmhDSC1Ic21OQnhhV3lnLU11dlF6dHJERTBDSEJHZDB2MVh0Vnk0In0.eyJleHAiOjE3NTQwNzYxMjMsImlhdCI6MTc1NDA3NTIyMywianRpIjoiNDlhYjRkZDItZDkwMC00MmU5LWE1MmYtY2M1MTAxZGRhYTlkIiwiaXNzIjoiaHR0cHM6Ly9jbG91ZC5haXJieXRlLmNvbS9hdXRoL3JlYWxtcy9fYWlyYnl0ZS1hcHBsaWNhdGlvbi1jbGllbnRzIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjU3NjRjODkyLTMxM2MtNGJmNS04MzQ2LTU1NGZhYjQ2YTMwZSIsInR5cCI6IkJlYXJlciIsImF6cCI6IjRhZjdhNTc0LWIxNTUtNDdlZS04ZGNlLTJjZDJjNTE5YTM0YSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtX2FpcmJ5dGUtYXBwbGljYXRpb24tY2xpZW50cyJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJjbGllbnRIb3N0IjoiMTcyLjIzLjEuMjQxIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJ1c2VyX2lkIjoiNTc2NGM4OTItMzEzYy00YmY1LTgzNDYtNTU0ZmFiNDZhMzBlIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic2VydmljZS1hY2NvdW50LTRhZjdhNTc0LWIxNTUtNDdlZS04ZGNlLTJjZDJjNTE5YTM0YSIsImNsaWVudEFkZHJlc3MiOiIxNzIuMjMuMS4yNDEiLCJjbGllbnRfaWQiOiI0YWY3YTU3NC1iMTU1LTQ3ZWUtOGRjZS0yY2QyYzUxOWEzNGEifQ.l0JpTWb2FCqL8BMoEX7rQBzaS25xqHNi51titMLdqLCYUNaFxNBgmXkNCDaH8RxIwMzk83CAvt9VNT2VTJD5w_1FR7OxiRRkHO9dwXYb4A0xpeVPrgDXorVUpA8bkrhMve9SGEAYj-S7clsvUWPyB50-ff4_S94cADv7PLC08AUa4-pNyKegyg3A1CIZYPw1kt4HldOHVPFLYyekdOl3PEnIILTmR89uOoY9tEm308DzsDM_-XVd_qWlzPqF74ao3zVNpTN6dghMOCEhZ4jZHs_kk19IxZvrZyoBxyS2w5L0M2sy4YUZHpeK1bCRk7rn0sPJkLk4aH9x-vp4ja3ERQ'
const AIRBYTE_WORKSPACE_ID = '293ab9ea-b538-4a5d-940d-7eacaffda8f5'

async function testAirbyteAPI() {
  console.log('🧪 Testing Airbyte API directly')
  console.log('==============================')
  
  console.log(`🔑 API Key: ${AIRBYTE_API_KEY.substring(0, 30)}...`)
  console.log(`🏢 Workspace: ${AIRBYTE_WORKSPACE_ID}`)
  console.log(`🌐 API URL: ${AIRBYTE_API_URL}`)
  
  // Test 1: Check workspace access
  console.log('\n📋 Test 1: Check workspace access')
  try {
    const workspaceResponse = await fetch(`${AIRBYTE_API_URL}/workspaces/${AIRBYTE_WORKSPACE_ID}`, {
      headers: {
        'Authorization': `Bearer ${AIRBYTE_API_KEY}`,
        'Accept': 'application/json'
      }
    })
    
    console.log(`📡 Workspace response: ${workspaceResponse.status}`)
    const workspaceData = await workspaceResponse.text()
    console.log(`📄 Workspace data:`, workspaceData.substring(0, 500))
    
  } catch (error) {
    console.error('❌ Workspace test failed:', error.message)
  }
  
  // Test 2: Try OAuth consent URL creation
  console.log('\n🔗 Test 2: OAuth consent URL creation')
  try {
    const provider = 'google-analytics'
    const sourceDefinitionId = '3cc2ebd2-a319-477e-8dd5-4a2db3ac6e4c'
    const redirectUri = 'http://localhost:7250/oauth-success'
    
    const requestBody = {
      workspaceId: AIRBYTE_WORKSPACE_ID,
      sourceDefinitionId: sourceDefinitionId,
      redirectUri: redirectUri,
      oAuthInputConfiguration: {
        property_ids: [],
        start_date: '2024-01-01',
        custom_reports_array: []
      }
    }
    
    console.log(`📤 Request body:`, JSON.stringify(requestBody, null, 2))
    
    const consentResponse = await fetch(`${AIRBYTE_API_URL}/sources/oAuth/consent_url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'OpsAI-Platform/1.0'
      },
      body: JSON.stringify(requestBody)
    })
    
    console.log(`📡 Consent response: ${consentResponse.status}`)
    console.log(`📋 Headers:`, Object.fromEntries(consentResponse.headers.entries()))
    
    const responseText = await consentResponse.text()
    console.log(`📄 Response:`, responseText)
    
    if (consentResponse.ok) {
      try {
        const result = JSON.parse(responseText)
        if (result.consentUrl) {
          console.log('✅ SUCCESS! OAuth URL created:', result.consentUrl)
          return result.consentUrl
        }
      } catch (e) {
        console.error('❌ Invalid JSON response')
      }
    } else {
      console.error('❌ OAuth consent URL creation failed')
    }
    
  } catch (error) {
    console.error('❌ OAuth test failed:', error.message)
  }
}

testAirbyteAPI();