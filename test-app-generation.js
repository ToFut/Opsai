const fetch = require('node-fetch');

async function testAppGeneration() {
  console.log('🧪 Testing app generation flow...');
  
  try {
    // First, test the discover endpoint with a sample URL
    console.log('\n1️⃣ Testing discover endpoint...');
    const discoverResponse = await fetch('http://localhost:3000/api/discover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        websiteUrl: 'https://example-healthcare.com',
        useAI: true 
      }),
    });
    
    const analysisResult = await discoverResponse.json();
    console.log('✅ Analysis result:', JSON.stringify(analysisResult, null, 2).substring(0, 500));
    
    // Create a sample confirmed insights object
    const confirmedInsights = {
      businessIntelligence: {
        industryCategory: 'Healthcare',
        businessModel: 'B2B Medical Equipment',
        revenueStreams: ['Equipment Sales', 'Maintenance Contracts'],
        targetAudience: 'Hospitals and Clinics',
        competitiveAdvantages: ['FDA Certified', 'AI-Powered Diagnostics'],
        operationalComplexity: 'high',
        scalabilityRequirements: 'national'
      },
      technicalRequirements: {
        dataModels: [
          {
            name: 'MedicalDevice',
            fields: [
              { name: 'deviceId', type: 'string', required: true, unique: true },
              { name: 'deviceName', type: 'string', required: true },
              { name: 'certificationStatus', type: 'string', required: true }
            ]
          }
        ],
        integrationOpportunities: [
          { service: 'QuickBooks', priority: 'critical', category: 'accounting' }
        ],
        workflowRequirements: [
          {
            name: 'device_certification_check',
            description: 'Check device certification status',
            trigger: 'schedule',
            steps: [
              { name: 'fetch_device_data', type: 'api_call' },
              { name: 'check_certification', type: 'validation' }
            ]
          }
        ]
      },
      userManagement: {
        userTypes: [
          { role: 'admin', description: 'System Administrator', permissions: ['all'] },
          { role: 'staff', description: 'Medical Staff', permissions: ['read', 'write'] }
        ],
        securityRequirements: {
          auditRequirements: true,
          dataEncryption: true
        }
      },
      uiuxRecommendations: {
        criticalFeatures: ['Device Dashboard', 'Compliance Tracking'],
        dashboardNeeds: {
          executiveDashboard: true,
          operationalDashboard: true,
          customerDashboard: false
        }
      }
    };
    
    // Test YAML generation
    console.log('\n2️⃣ Testing YAML generation...');
    const yamlResponse = await fetch('http://localhost:3000/api/ai-generate-yaml-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessAnalysis: analysisResult,
        confirmedInsights: confirmedInsights,
        connectedProviders: [],
        businessProfile: {
          businessName: 'MedTech Solutions',
          businessType: 'Healthcare Technology',
          industry: 'healthcare',
          website: 'https://example-healthcare.com'
        }
      }),
    });
    
    const yamlResult = await yamlResponse.json();
    console.log('✅ YAML generation result:', yamlResult.success);
    console.log('   YAML preview:', yamlResult.yaml?.substring(0, 200));
    
    // Test app generation
    console.log('\n3️⃣ Testing app generation...');
    const appResponse = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        yamlConfig: yamlResult.yaml,
        appName: 'Test Healthcare App'
      }),
    });
    
    const appResult = await appResponse.json();
    console.log('✅ App generation result:', appResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAppGeneration();