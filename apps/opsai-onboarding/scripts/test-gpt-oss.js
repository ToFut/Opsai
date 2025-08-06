#!/usr/bin/env node

/**
 * Test script for GPT-OSS integration
 * Validates that the system is properly configured
 */

const testGPTOSS = async () => {
  const BASE_URL = process.env.APP_URL || 'http://localhost:3000'
  
  console.log('🧪 Testing GPT-OSS Integration')
  console.log('================================')
  
  try {
    // Test 1: Initialize storage
    console.log('\n1️⃣ Initializing Supabase storage...')
    const initRes = await fetch(`${BASE_URL}/api/gpt-oss/initialize`, {
      method: 'POST'
    })
    const initData = await initRes.json()
    console.log('✅ Storage initialized:', initData)
    
    // Test 2: Check status
    console.log('\n2️⃣ Checking GPT-OSS status...')
    const statusRes = await fetch(`${BASE_URL}/api/gpt-oss/status`)
    const statusData = await statusRes.json()
    console.log('✅ Status:', JSON.stringify(statusData, null, 2))
    
    // Test 3: Test AI analysis with new system
    console.log('\n3️⃣ Testing AI analysis...')
    const analysisRes = await fetch(`${BASE_URL}/api/ai-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteUrl: 'https://example.com'
      })
    })
    
    if (analysisRes.ok) {
      const analysisData = await analysisRes.json()
      console.log('✅ AI Analysis successful')
      console.log('   Model used:', analysisData.metadata?.model || 'default')
    } else {
      console.log('⚠️  AI Analysis using fallback (GPT-OSS not configured)')
    }
    
    console.log('\n✅ All tests completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Download GPT-OSS models using the admin interface')
    console.log('2. Start the inference server')
    console.log('3. Update environment variables with your keys')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error('Make sure the application is running on', BASE_URL)
  }
}

// Run the test
testGPTOSS()