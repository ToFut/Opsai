const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugYAML() {
  const analysisData = {
    businessAnalysis: {
      businessName: "TOV Furniture",
      website: "https://tovfurniture.com",
      industry: "furniture-retail"
    },
    confirmedInsights: {
      businessIntelligence: {
        industryCategory: "furniture-retail",
        businessModel: "e-commerce",
        revenueStreams: ["product-sales", "delivery-services"],
        targetAudience: "homeowners",
        competitiveAdvantages: ["quality-craftsmanship", "custom-designs"],
        operationalComplexity: "medium",
        scalabilityRequirements: "regional"
      },
      technicalRequirements: {
        dataModels: [
          {
            name: "Product",
            fields: ["name", "price", "category", "inventory"]
          }
        ],
        integrationOpportunities: [
          { provider: "shopify", purpose: "e-commerce" }
        ],
        workflowRequirements: ["inventory-sync"]
      },
      userManagement: {
        userTypes: ["customer", "admin"],
        securityRequirements: {
          encryption: true,
          compliance: "standard"
        }
      },
      uiuxRecommendations: {
        criticalFeatures: ["product-catalog", "shopping-cart"]
      }
    },
    businessProfile: {
      businessName: "TOV Furniture",
      businessType: "furniture-retail"
    }
  };

  try {
    const response = await fetch('http://localhost:3010/api/ai-generate-yaml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisData)
    });

    const data = await response.json();
    console.log('✅ YAML generation successful');
    console.log('🏗️  YAML config (first 500 chars):');
    console.log(data.yaml.substring(0, 500));
    
    // Test the app generation step
    console.log('\n📡 Testing app generation...');
    const genResponse = await fetch('http://localhost:3010/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        yamlConfig: data.yaml,
        appName: "TOV Furniture Debug Test"
      })
    });

    const genText = await genResponse.text();
    console.log('📥 Generation response status:', genResponse.status);
    console.log('📥 Generation response:', genText.substring(0, 1000));
  } catch (error) {
    console.error('Error:', error);
  }
}

debugYAML();