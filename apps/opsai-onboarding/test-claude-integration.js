// Test script for Claude GitHub integration
const testClaudeIntegration = async () => {
  console.log('🧪 Testing Claude GitHub Integration...\n');

  // Test 1: Check if API route exists
  console.log('1️⃣ Testing API route...');
  try {
    const response = await fetch('http://localhost:3010/api/claude-github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Test message',
        appId: 'test-app-123',
        appName: 'Test App',
        action: 'create_issue',
        context: {
          currentFeatures: ['auth', 'dashboard'],
          businessRequirements: 'Test requirements'
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API route working:', data);
    } else {
      console.log('❌ API route error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ API route failed:', error.message);
  }

  // Test 2: Check environment variables
  console.log('\n2️⃣ Checking environment variables...');
  const requiredVars = ['ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('❌ Missing environment variables:', missingVars);
  }

  // Test 3: Check if components exist
  console.log('\n3️⃣ Checking component files...');
  const fs = require('fs');
  const path = require('path');
  
  const components = [
    'components/ClaudeGitHubChat.tsx',
    'app/api/claude-github/route.ts',
    'CLAUDE.md'
  ];

  components.forEach(component => {
    const filePath = path.join(__dirname, component);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${component} exists`);
    } else {
      console.log(`❌ ${component} missing`);
    }
  });

  console.log('\n🎉 Claude GitHub Integration Test Complete!');
};

// Run the test
testClaudeIntegration().catch(console.error); 