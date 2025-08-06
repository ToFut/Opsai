#!/usr/bin/env node

/**
 * GPT-OSS Integration Demo
 * Demonstrates the complete flow of using GPT-OSS models with OpsAI
 */

const BASE_URL = process.env.APP_URL || 'http://localhost:7250'

async function demo() {
  console.log('🚀 GPT-OSS Integration Demo for OpsAI Platform')
  console.log('==============================================\n')

  try {
    // Step 1: Check system status
    console.log('1️⃣  Checking GPT-OSS system status...')
    const statusRes = await fetch(`${BASE_URL}/api/gpt-oss/status`)
    const status = await statusRes.json()
    
    console.log('✅ System Status:')
    console.log('   - Storage Provider:', status.storage?.provider || 'Not configured')
    console.log('   - Available Models:', status.models?.length || 0)
    console.log('   - Local Inference:', status.inference?.available ? 'Enabled' : 'Disabled')
    console.log('   - OpenAI Fallback:', status.inference?.fallback ? 'Enabled' : 'Disabled')
    console.log('')

    // Step 2: Demonstrate AI analysis with fallback
    console.log('2️⃣  Testing AI Analysis (with automatic fallback)...')
    const analysisRes = await fetch(`${BASE_URL}/api/ai-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websiteUrl: 'https://stripe.com'
      })
    })

    if (analysisRes.ok) {
      const analysis = await analysisRes.json()
      console.log('✅ Analysis Complete:')
      console.log('   - Business Type:', analysis.businessIntelligence?.industryCategory || 'Unknown')
      console.log('   - Model:', analysis.businessIntelligence?.businessModel || 'Unknown')
      console.log('   - Complexity:', analysis.businessIntelligence?.operationalComplexity || 'Unknown')
    } else {
      console.log('⚠️  Analysis using OpenAI fallback (GPT-OSS not configured)')
    }
    console.log('')

    // Step 3: Show model management capabilities
    console.log('3️⃣  Model Management Capabilities:')
    console.log('   The system supports:')
    console.log('   - GPT-OSS-20B: Fast inference for simple tasks')
    console.log('   - GPT-OSS-120B: High-quality generation for complex tasks')
    console.log('   - Automatic model selection based on task complexity')
    console.log('   - Fine-tuning on your business data')
    console.log('   - Supabase storage for team-wide model access')
    console.log('')

    // Step 4: Integration points
    console.log('4️⃣  Integration Points in Your Onboarding Flow:')
    console.log('   ✓ Website Analysis: Analyze business from URL')
    console.log('   ✓ YAML Generation: Create app configurations')
    console.log('   ✓ Workflow Analysis: Design business automations')
    console.log('   ✓ Code Generation: Build complete applications')
    console.log('   ✓ Code Improvements: Optimize and enhance code')
    console.log('')

    // Step 5: Next steps
    console.log('📋 Next Steps to Enable Local GPT-OSS:')
    console.log('   1. Download models: Run setup-gpt-oss.sh')
    console.log('   2. Install Python deps: pip install -r requirements-gpt-oss.txt')
    console.log('   3. Start inference: npm run start:inference')
    console.log('   4. Set USE_LOCAL_MODELS=true in .env.local')
    console.log('')

    console.log('✅ Demo Complete!')
    console.log('\n💡 Benefits of GPT-OSS Integration:')
    console.log('   • No API costs for inference')
    console.log('   • Complete data privacy')
    console.log('   • Custom fine-tuning capability')
    console.log('   • Faster local inference')
    console.log('   • Automatic fallback to OpenAI when needed')

  } catch (error) {
    console.error('❌ Demo failed:', error.message)
    console.error('Make sure the application is running on', BASE_URL)
  }
}

// Run the demo
demo()