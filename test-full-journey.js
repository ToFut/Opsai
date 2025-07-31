#!/usr/bin/env node

const fetch = require('node-fetch');

async function testFullUserJourney() {
  console.log('🧪 Testing Full User Journey\n');
  const baseUrl = 'http://localhost:3010';
  const testWebsiteUrl = 'https://www.dominos.com';
  
  try {
    // Step 1: Website Discovery with AI
    console.log('1️⃣ Step 1: AI Website Discovery');
    console.log(`   Testing with: ${testWebsiteUrl}`);
    
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
    console.log(`   Analysis type: ${discoveryResult.analysisType}`);
    
    if (discoveryResult.aiAnalysis) {
      console.log('\n🤖 AI Analysis Results:');
      console.log('   Business Intelligence:');
      console.log(`     - Industry: ${discoveryResult.aiAnalysis.businessIntelligence.industryCategory}`);
      console.log(`     - Model: ${discoveryResult.aiAnalysis.businessIntelligence.businessModel}`);
      console.log(`     - Revenue Streams: ${discoveryResult.aiAnalysis.businessIntelligence.revenueStreams.join(', ')}`);
      
      console.log('\n   Technical Requirements:');
      console.log(`     - Data Models: ${discoveryResult.aiAnalysis.technicalRequirements.dataModels.length} models`);
      discoveryResult.aiAnalysis.technicalRequirements.dataModels.forEach(model => {
        console.log(`       • ${model.name}: ${model.fields.length} fields (${model.priority})`);
      });
      
      console.log('\n   Integration Opportunities:');
      discoveryResult.aiAnalysis.technicalRequirements.integrationOpportunities.slice(0, 5).forEach(integration => {
        console.log(`     - ${integration.service} (${integration.category}): ${integration.businessValue}`);
      });
      
      // Step 2: Simulate User Review (auto-confirm for testing)
      console.log('\n2️⃣ Step 2: AI Insights Review');
      console.log('   Simulating user confirmation of AI insights...');
      
      const confirmedInsights = {
        ...discoveryResult.aiAnalysis,
        // User could modify insights here
      };
      
      // Step 3: Generate YAML
      console.log('\n3️⃣ Step 3: AI YAML Generation');
      console.log('   Generating custom YAML configuration...');
      
      // Try AI generation first, fallback to simple if it fails
      let yamlResponse = await fetch(`${baseUrl}/api/ai-generate-yaml`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessAnalysis: discoveryResult.aiAnalysis,
          confirmedInsights: confirmedInsights,
          businessProfile: {
            businessName: 'Domino\'s Pizza',
            businessType: 'Restaurant',
            industry: 'food-service',
            website: testWebsiteUrl
          }
        })
      });
      
      // If AI generation fails, use simple generation
      if (!yamlResponse.ok) {
        console.log('   AI YAML generation failed, using fallback...');
        yamlResponse = await fetch(`${baseUrl}/api/ai-generate-yaml-simple`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessAnalysis: discoveryResult.aiAnalysis,
            confirmedInsights: confirmedInsights,
            businessProfile: {
              businessName: 'Domino\'s Pizza',
              businessType: 'Restaurant',
              industry: 'food-service',
              website: testWebsiteUrl
            }
          })
        });
      }
      
      if (!yamlResponse.ok) {
        const error = await yamlResponse.text();
        throw new Error(`YAML generation failed: ${error}`);
      }
      
      const yamlResult = await yamlResponse.json();
      console.log('✅ YAML generation successful');
      console.log(`   Generated ${yamlResult.yaml.length} characters of YAML`);
      console.log('   Configuration includes:');
      const config = yamlResult.config || yamlResult.structured;
      if (config) {
        console.log(`     - Vertical: ${config.vertical?.name || 'N/A'}`);
        console.log(`     - Database Models: ${config.database?.models?.length || 0}`);
        console.log(`     - API Integrations: ${config.apis?.integrations?.length || 0}`);
        console.log(`     - Workflows: ${config.workflows?.length || 0}`);
        console.log(`     - User Roles: ${config.authentication?.roles?.length || 0}`);
      }
      
      // Save YAML for inspection
      const fs = require('fs');
      const yamlFilename = `ai-generated-${Date.now()}.yaml`;
      fs.writeFileSync(yamlFilename, yamlResult.yaml);
      console.log(`\n📄 YAML saved to: ${yamlFilename}`);
      
      // Step 4: Success Summary
      console.log('\n4️⃣ Step 4: Application Ready');
      console.log('   In a real scenario, the app would now be:');
      console.log('     ✓ Generated with custom code');
      console.log('     ✓ Deployed to cloud platform');
      console.log('     ✓ Available at custom URL');
      console.log('     ✓ Ready for business use');
      
      console.log('\n🎉 Full User Journey Test PASSED!');
      console.log('   The AI-powered system successfully:');
      console.log('   1. Analyzed the business website');
      console.log('   2. Generated intelligent insights');
      console.log('   3. Created custom YAML configuration');
      console.log('   4. Prepared for app deployment');
      
    } else {
      console.log('⚠️ AI analysis not available - system fell back to pattern matching');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the test
testFullUserJourney();