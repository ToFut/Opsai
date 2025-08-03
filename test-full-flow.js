async function testFullFlow() {
  console.log('🧪 Testing full app generation flow...\n');
  
  console.log('📋 Step 1: Generate YAML using simple API');
  
  const confirmedInsights = {
    businessIntelligence: {
      industryCategory: 'Healthcare',
      businessModel: 'Medical Equipment B2B',
      revenueStreams: ['Equipment Sales', 'Service Contracts'],
      targetAudience: 'Hospitals and Clinics',
      competitiveAdvantages: ['FDA Certified', 'AI-Powered'],
      operationalComplexity: 'high',
      scalabilityRequirements: 'national'
    },
    technicalRequirements: {
      dataModels: [
        {
          name: 'Device',
          description: 'Medical devices',
          fields: [
            { name: 'deviceId', type: 'string', required: true, unique: true },
            { name: 'deviceName', type: 'string', required: true },
            { name: 'status', type: 'string', required: true }
          ]
        }
      ],
      integrationOpportunities: [],
      workflowRequirements: []
    },
    userManagement: {
      userTypes: [
        { role: 'admin', description: 'Administrator', permissions: ['all'] }
      ],
      securityRequirements: { auditRequirements: true }
    },
    uiuxRecommendations: {
      criticalFeatures: ['Device Dashboard'],
      dashboardNeeds: { operationalDashboard: true }
    }
  };

  try {
    // Generate YAML
    const yamlResponse = await fetch('http://localhost:3010/api/ai-generate-yaml-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessAnalysis: {},
        confirmedInsights: confirmedInsights,
        connectedProviders: [],
        businessProfile: {
          businessName: 'MedTech Solutions',
          businessType: 'Healthcare Technology',
          industry: 'healthcare',
          website: 'https://medtech.com'
        }
      })
    });

    const yamlResult = await yamlResponse.json();
    console.log('✅ YAML generated:', yamlResult.success);
    console.log('📏 YAML length:', yamlResult.yaml?.length);
    
    if (!yamlResult.success) {
      throw new Error('YAML generation failed');
    }

    console.log('\n📋 Step 2: Generate app using YAML');
    
    // Generate app
    const appResponse = await fetch('http://localhost:3010/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        yamlConfig: yamlResult.yaml,
        appName: 'MedTech Solutions App'
      })
    });

    const appResult = await appResponse.json();
    console.log('✅ App generated:', appResult.success);
    
    if (appResult.success) {
      console.log('\n🎉 SUCCESS! Full flow completed:');
      console.log(`   📁 App location: ${appResult.outputDir}`);
      console.log(`   🌐 App URL: http://localhost:${appResult.port}`);
      console.log(`   📝 Message: ${appResult.message}`);
    } else {
      console.log('\n❌ App generation failed:', appResult.error);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
console.log('========================================');
console.log('      FULL FLOW INTEGRATION TEST        ');
console.log('========================================\n');

testFullFlow().catch(console.error);