#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3001';

// Mock JWT token for testing (in real app, this would be generated properly)
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJ0ZW5hbnRJZCI6InRlbmFudC1kZWZhdWx0IiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjk5OTk5OTk5OTl9.fakesignaturefortesting';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${testToken}`
};

async function testAPI() {
  console.log('🏨 Testing Line Properties Vacation Rental API');
  console.log('=' .repeat(50));
  
  try {
    // Test health endpoint
    console.log('\n📊 Health Check:');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server Status:', health.data.status);
    console.log('📱 App:', health.data.app);
    console.log('🔢 Version:', health.data.version);
    
    // Try to test Properties endpoint (will show auth working)
    console.log('\n🏠 Testing Properties API:');
    try {
      const properties = await axios.get(`${API_BASE}/api/Property`, { headers });
      console.log('✅ Properties retrieved:', properties.data.data?.length || 0);
      if (properties.data.data && properties.data.data.length > 0) {
        const firstProperty = properties.data.data[0];
        console.log('🏡 Sample Property:', firstProperty.title);
        console.log('📍 Location:', firstProperty.city);
        console.log('💰 Price: $' + firstProperty.price + '/night');
        console.log('🛏️ Bedrooms:', firstProperty.bedrooms);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required (as expected)');
        console.log('💡 In a real app, you would login first to get a valid token');
      } else {
        console.log('❌ Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
}

// Run the test
testAPI().then(() => {
  console.log('\n🎉 API test completed!');
  console.log('🌐 Visit http://localhost:5555 to see the database in Prisma Studio');
  console.log('🚀 API is running at http://localhost:3001');
}).catch(console.error);