#!/usr/bin/env node

require('dotenv').config();

const AIRBYTE_CLOUD_API_KEY = process.env.AIRBYTE_CLOUD_API_KEY;
const AIRBYTE_API_URL = 'https://api.airbyte.com/v1';

async function checkWorkspace() {
  console.log('🔍 Checking Airbyte Workspace Configuration\n');

  try {
    // 1. Check workspaces
    console.log('1️⃣ Fetching workspaces...');
    const workspacesResponse = await fetch(`${AIRBYTE_API_URL}/workspaces`, {
      headers: {
        'Authorization': `Bearer ${AIRBYTE_CLOUD_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    const workspacesData = await workspacesResponse.json();
    console.log('Workspaces response:', JSON.stringify(workspacesData, null, 2));
    
    const workspaces = workspacesData.data || [];
    console.log(`\nFound ${workspaces.length} workspaces:`);
    workspaces.forEach(w => {
      console.log(`  - ${w.name} (${w.workspaceId})`);
    });

    if (workspaces.length === 0) {
      console.log('\n❌ No workspaces found. Check API key permissions.');
      return;
    }

    // Use the first workspace
    const workspaceId = workspaces[0].workspaceId;
    console.log(`\n2️⃣ Using workspace: ${workspaceId}`);

    // 2. List sources with workspace filter
    console.log('\n3️⃣ Fetching sources for workspace...');
    const sourcesUrl = `${AIRBYTE_API_URL}/sources?workspaceId=${workspaceId}`;
    console.log(`URL: ${sourcesUrl}`);
    
    const sourcesResponse = await fetch(sourcesUrl, {
      headers: {
        'Authorization': `Bearer ${AIRBYTE_CLOUD_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    const sourcesData = await sourcesResponse.json();
    console.log('Sources response:', JSON.stringify(sourcesData, null, 2));

    // 3. List destinations with workspace filter
    console.log('\n4️⃣ Fetching destinations for workspace...');
    const destUrl = `${AIRBYTE_API_URL}/destinations?workspaceId=${workspaceId}`;
    console.log(`URL: ${destUrl}`);
    
    const destResponse = await fetch(destUrl, {
      headers: {
        'Authorization': `Bearer ${AIRBYTE_CLOUD_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    const destData = await destResponse.json();
    console.log('Destinations response:', JSON.stringify(destData, null, 2));

    // 4. Check connections
    console.log('\n5️⃣ Fetching connections for workspace...');
    const connUrl = `${AIRBYTE_API_URL}/connections?workspaceId=${workspaceId}`;
    const connResponse = await fetch(connUrl, {
      headers: {
        'Authorization': `Bearer ${AIRBYTE_CLOUD_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    const connData = await connResponse.json();
    console.log('Connections response:', JSON.stringify(connData, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

checkWorkspace();