#!/usr/bin/env node

// Simple test script to verify AI analysis endpoints work
const fetch = require('node-fetch');

async function testAIAnalysis() {
  console.log('🧪 Testing AI Analysis Endpoints...\n');
  
  const testWebsiteUrl = 'https://www.dominos.com';
  const baseUrl = 'http://localhost:3010';
  
  try {
    // Step 1: Test discovery with AI
    console.log('1️⃣ Testing website discovery with AI...');
    const discoverResponse = await fetch(`${baseUrl}/api/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        websiteUrl: testWebsiteUrl,
        useAI: true 
      })
    });
    
    if (!discoverResponse.ok) {
      throw new Error(`Discovery failed: ${discoverResponse.status}`);
    }
    
    const discoveryResult = await discoverResponse.json();
    console.log('✅ Discovery successful');
    console.log('Analysis type:', discoveryResult.analysisType);
    
    if (discoveryResult.aiAnalysis) {
      console.log('🤖 AI Analysis available');
      console.log('Business Intelligence:', discoveryResult.aiAnalysis.businessIntelligence);
      
      // Step 2: Test YAML generation
      console.log('\n2️⃣ Testing AI YAML generation...');
      const yamlResponse = await fetch(`${baseUrl}/api/ai-generate-yaml`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessAnalysis: discoveryResult.aiAnalysis,
          confirmedInsights: discoveryResult.aiAnalysis,
          businessProfile: {
            businessName: 'Test Restaurant',
            businessType: 'Restaurant',
            industry: 'food-service',
            website: testWebsiteUrl
          }
        })
      });
      
      if (!yamlResponse.ok) {
        throw new Error(`YAML generation failed: ${yamlResponse.status}`);
      }
      
      const yamlResult = await yamlResponse.json();
      console.log('✅ YAML generation successful');
      console.log('Generated YAML length:', yamlResult.yaml.length);
      console.log('Configuration structure:', Object.keys(yamlResult.structured));
      
      // Save YAML to file for inspection
      const fs = require('fs');
      fs.writeFileSync('./generated-test.yaml', yamlResult.yaml);
      console.log('📄 YAML saved to generated-test.yaml');
      
    } else {
      console.log('⚠️ No AI analysis available - falling back to pattern matching');
      console.log('Detected systems:', discoveryResult.detectedSystems);
    }
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAIAnalysis();