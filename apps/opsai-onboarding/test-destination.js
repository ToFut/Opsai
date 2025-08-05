#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const AIRBYTE_API_KEY = process.env.AIRBYTE_API_KEY;
const AIRBYTE_API_URL = 'https://api.airbyte.com/v1';
const WORKSPACE_ID = process.env.AIRBYTE_WORKSPACE_ID;

async function testDestination() {
  console.log('🔍 Testing Airbyte Destination\n');

  try {
    // Get access token
    const tokenResponse = await fetch('https://api.airbyte.com/v1/applications/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AIRBYTE_CLIENT_ID,
        client_secret: process.env.AIRBYTE_CLIENT_SECRET
      })
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 1. List destinations
    console.log('1️⃣ Fetching destinations...');
    const destResponse = await fetch(`${AIRBYTE_API_URL}/destinations?workspaceId=${WORKSPACE_ID}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    const destData = await destResponse.json();
    console.log(`Found ${destData.data?.length || 0} destinations:`);
    destData.data?.forEach(d => {
      console.log(`  - ${d.name} (${d.destinationId}) - Type: ${d.destinationType}`);
    });

    // Find Supabase destination
    const supabaseDestination = destData.data?.find(d => d.name.includes('supabase'));
    
    if (!supabaseDestination) {
      console.log('\n❌ No Supabase destination found');
      return;
    }

    console.log(`\n2️⃣ Testing Supabase destination: ${supabaseDestination.name}`);

    // Test connection
    const testResponse = await fetch(`${AIRBYTE_API_URL}/destinations/${supabaseDestination.destinationId}/check_connection`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    const testResult = await testResponse.json();
    
    if (testResponse.ok) {
      console.log('✅ Destination connection test result:', testResult);
    } else {
      console.log('❌ Destination connection test failed:', testResult);
    }

    // Get destination details
    console.log(`\n3️⃣ Getting destination configuration...`);
    const detailResponse = await fetch(`${AIRBYTE_API_URL}/destinations/${supabaseDestination.destinationId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    const detailData = await detailResponse.json();
    console.log('Destination config:', JSON.stringify(detailData.configuration, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDestination();