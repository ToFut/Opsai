#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const AIRBYTE_API_KEY = process.env.AIRBYTE_API_KEY;
const AIRBYTE_API_URL = 'https://api.airbyte.com/v1';
const WORKSPACE_ID = process.env.AIRBYTE_WORKSPACE_ID;

async function testGitHubSource() {
  console.log('🔍 Testing GitHub Source\n');

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

    // 1. List sources
    console.log('1️⃣ Fetching sources...');
    const sourcesResponse = await fetch(`${AIRBYTE_API_URL}/sources?workspaceId=${WORKSPACE_ID}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    const sourcesData = await sourcesResponse.json();
    console.log(`Found ${sourcesData.data?.length || 0} sources:`);
    sourcesData.data?.forEach(s => {
      console.log(`  - ${s.name} (${s.sourceId}) - Type: ${s.sourceType}`);
    });

    // Find GitHub source
    const githubSource = sourcesData.data?.find(s => s.name.includes('github'));
    
    if (!githubSource) {
      console.log('\n❌ No GitHub source found');
      return;
    }

    console.log(`\n2️⃣ Testing GitHub source: ${githubSource.name}`);

    // Get source details
    console.log(`\n3️⃣ Getting source configuration...`);
    const detailResponse = await fetch(`${AIRBYTE_API_URL}/sources/${githubSource.sourceId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    const detailData = await detailResponse.json();
    console.log('Source config:');
    console.log('  - Repositories:', detailData.configuration.repositories);
    console.log('  - Start date:', detailData.configuration.start_date);
    console.log('  - Credentials type:', detailData.configuration.credentials?.personal_access_token ? 'PAT' : 'Other');

    // Test connection
    console.log(`\n4️⃣ Testing source connection...`);
    const testResponse = await fetch(`${AIRBYTE_API_URL}/sources/${githubSource.sourceId}/check_connection`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const testResult = await testResponse.json();
    
    if (testResponse.ok) {
      console.log('✅ Source connection test result:', testResult);
    } else {
      console.log('❌ Source connection test failed:');
      console.log('Status:', testResponse.status);
      console.log('Result:', JSON.stringify(testResult, null, 2));
    }

    // Try to discover schema
    console.log(`\n5️⃣ Discovering source schema...`);
    const discoverResponse = await fetch(`${AIRBYTE_API_URL}/sources/${githubSource.sourceId}/discover_schema`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (discoverResponse.ok) {
      const schemaData = await discoverResponse.json();
      console.log('✅ Schema discovery successful');
      console.log('Available streams:', schemaData.catalog?.streams?.length || 0);
    } else {
      const schemaError = await discoverResponse.json();
      console.log('❌ Schema discovery failed:', schemaError);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGitHubSource();