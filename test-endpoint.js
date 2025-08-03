async function testEndpoint() {
  console.log('🧪 Testing if generate endpoint is accessible...\n');
  
  try {
    // First test GET
    console.log('📡 Testing GET /api/generate...');
    const getResponse = await fetch('http://localhost:3010/api/generate');
    console.log('  Status:', getResponse.status);
    const getData = await getResponse.json();
    console.log('  Response:', JSON.stringify(getData, null, 2));
    
    // Then test POST with minimal data
    console.log('\n📡 Testing POST /api/generate with minimal data...');
    const postResponse = await fetch('http://localhost:3010/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        yamlConfig: 'test',
        appName: 'Test'
      }),
    });
    console.log('  Status:', postResponse.status);
    
    if (postResponse.ok || postResponse.status < 500) {
      const postData = await postResponse.text();
      console.log('  Response:', postData);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Run the test
testEndpoint().catch(console.error);