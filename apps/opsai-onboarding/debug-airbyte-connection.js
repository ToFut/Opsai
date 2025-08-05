#!/usr/bin/env node

require('dotenv').config();

const AIRBYTE_CLOUD_API_KEY = process.env.AIRBYTE_CLOUD_API_KEY;
const AIRBYTE_API_URL = 'https://api.airbyte.com/v1';

async function debugConnection() {
  console.log('🔍 Debugging Airbyte Connection Creation\n');

  try {
    // 1. List sources
    console.log('1️⃣ Fetching sources...');
    const sourcesResponse = await fetch(`${AIRBYTE_API_URL}/sources`, {
      headers: {
        'Authorization': `Bearer ${AIRBYTE_CLOUD_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    const sourcesData = await sourcesResponse.json();
    const sources = sourcesData.data || [];
    console.log(`Found ${sources.length} sources:`);
    sources.forEach(s => {
      console.log(`  - ${s.name} (${s.sourceId}) - Type: ${s.sourceType}`);
    });

    // 2. List destinations
    console.log('\n2️⃣ Fetching destinations...');
    const destResponse = await fetch(`${AIRBYTE_API_URL}/destinations`, {
      headers: {
        'Authorization': `Bearer ${AIRBYTE_CLOUD_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    const destData = await destResponse.json();
    const destinations = destData.data || [];
    console.log(`Found ${destinations.length} destinations:`);
    destinations.forEach(d => {
      console.log(`  - ${d.name} (${d.destinationId}) - Type: ${d.destinationType}`);
    });

    // 3. Find GitHub source and Supabase destination
    const githubSource = sources.find(s => s.name.includes('github'));
    const supabaseDest = destinations.find(d => d.name.includes('supabase'));

    if (!githubSource || !supabaseDest) {
      console.log('\n❌ Could not find GitHub source or Supabase destination');
      return;
    }

    console.log('\n3️⃣ Selected for connection:');
    console.log(`  Source: ${githubSource.name} (${githubSource.sourceId})`);
    console.log(`  Destination: ${supabaseDest.name} (${supabaseDest.destinationId})`);

    // 4. Check source configuration
    console.log('\n4️⃣ Checking source configuration...');
    const sourceDetail = await fetch(`${AIRBYTE_API_URL}/sources/${githubSource.sourceId}`, {
      headers: {
        'Authorization': `Bearer ${AIRBYTE_CLOUD_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const sourceData = await sourceDetail.json();
    console.log('Source configuration:');
    console.log(JSON.stringify(sourceData.configuration, null, 2));

    // 5. Try to create a minimal connection
    console.log('\n5️⃣ Attempting to create connection...');
    const connectionData = {
      name: `Test GitHub to Supabase - ${new Date().toISOString()}`,
      sourceId: githubSource.sourceId,
      destinationId: supabaseDest.destinationId,
      namespaceDefinition: 'custom_format',
      namespaceFormat: 'github_test',
      status: 'active',
      schedule: {
        scheduleType: 'manual'
      }
    };

    console.log('Connection payload:');
    console.log(JSON.stringify(connectionData, null, 2));

    const createResponse = await fetch(`${AIRBYTE_API_URL}/connections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRBYTE_CLOUD_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(connectionData)
    });

    const createData = await createResponse.json();

    if (createResponse.ok) {
      console.log('\n✅ Connection created successfully!');
      console.log(JSON.stringify(createData, null, 2));
    } else {
      console.log('\n❌ Failed to create connection:');
      console.log(`Status: ${createResponse.status}`);
      console.log(`Error: ${JSON.stringify(createData, null, 2)}`);
      
      // If it's a 500 error, try to get more details
      if (createResponse.status === 500) {
        console.log('\n🔍 Debugging 500 error...');
        
        // Check if source needs reconfiguration
        console.log('\n6️⃣ Checking if source needs update...');
        const testResponse = await fetch(`${AIRBYTE_API_URL}/sources/${githubSource.sourceId}/check_connection`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRBYTE_CLOUD_API_KEY}`,
            'Accept': 'application/json'
          }
        });

        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('Source check result:', testData);
        } else {
          const errorData = await testResponse.json();
          console.log('Source check failed:', errorData);
        }

        // Check destination too
        console.log('\n7️⃣ Checking destination...');
        const destTestResponse = await fetch(`${AIRBYTE_API_URL}/destinations/${supabaseDest.destinationId}/check_connection`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRBYTE_CLOUD_API_KEY}`,
            'Accept': 'application/json'
          }
        });

        if (destTestResponse.ok) {
          const destTestData = await destTestResponse.json();
          console.log('Destination check result:', destTestData);
        } else {
          const destErrorData = await destTestResponse.json();
          console.log('Destination check failed:', destErrorData);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

debugConnection();