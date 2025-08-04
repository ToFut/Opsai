#!/usr/bin/env node

async function testCompleteFlow() {
  console.log('🧪 Testing Complete OAuth Flow with Temp Storage\n');
  
  const tenantId = 'default';
  const providers = ['github', 'google'];
  
  for (const provider of providers) {
    console.log(`\n📌 Testing ${provider.toUpperCase()} flow:`);
    
    // 1. Simulate OAuth callback (this would normally happen via browser)
    console.log('1️⃣ Simulating OAuth callback...');
    
    // 2. Fetch sample data
    console.log('2️⃣ Fetching sample data...');
    
    try {
      const response = await fetch('http://localhost:7250/api/providers/sample-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          accessToken: provider === 'github' ? 'test_token_123' : 'google_test_token',
          tenantId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sample data collected successfully');
        
        // Manually save to temp storage to simulate the OAuth callback
        const fs = require('fs');
        const path = require('path');
        const storageDir = path.join(process.cwd(), '.temp-storage');
        
        if (!fs.existsSync(storageDir)) {
          fs.mkdirSync(storageDir, { recursive: true });
        }
        
        // Save sample data
        const sampleFile = path.join(storageDir, `sample_${tenantId}_${provider}.json`);
        fs.writeFileSync(sampleFile, JSON.stringify({
          tenant_id: tenantId,
          provider,
          sample_data: result.sampleData,
          data_analysis: result.analysis,
          collected_at: new Date().toISOString()
        }, null, 2));
        
        console.log(`💾 Saved to: ${sampleFile}`);
      } else {
        console.error('❌ Failed to fetch sample data:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
  
  // 3. Organize database
  console.log('\n3️⃣ Organizing database with all sample data...');
  
  try {
    const response = await fetch('http://localhost:7250/api/organize-database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Database organized successfully!');
      console.log(`   Schema ID: ${result.schemaId}`);
      console.log(`   Message: ${result.message}`);
    } else {
      console.error('❌ Failed to organize database:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // 4. Verify results
  console.log('\n4️⃣ Verifying results...');
  require('./verify-flow.js');
}

// Run the test
testCompleteFlow().catch(console.error);