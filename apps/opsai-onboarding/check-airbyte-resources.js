#!/usr/bin/env node

const { airbyteTerraformSDK } = require('./lib/airbyte-terraform-sdk');

async function checkAirbyteResources() {
  console.log('🔍 Checking Airbyte Workspace Resources...\n');
  
  try {
    // Get sources
    console.log('📋 SOURCES:');
    const sourcesResponse = await airbyteTerraformSDK.makeApiRequest('/sources');
    const sources = await sourcesResponse.json();
    
    if (sources.data) {
      sources.data.forEach(source => {
        console.log(`  - ${source.name} (${source.sourceId})`);
        console.log(`    Type: ${source.sourceType || 'Unknown'}`);
        console.log(`    Workspace: ${source.workspaceId}`);
      });
    }
    
    // Get destinations
    console.log('\n📋 DESTINATIONS:');
    const destResponse = await airbyteTerraformSDK.makeApiRequest('/destinations');
    const destinations = await destResponse.json();
    
    if (destinations.data) {
      destinations.data.forEach(dest => {
        console.log(`  - ${dest.name} (${dest.destinationId})`);
        console.log(`    Type: ${dest.destinationType || 'Unknown'}`);
        console.log(`    Workspace: ${dest.workspaceId}`);
      });
    }
    
    // Get connections
    console.log('\n📋 CONNECTIONS:');
    const connResponse = await airbyteTerraformSDK.makeApiRequest('/connections');
    const connections = await connResponse.json();
    
    if (connections.data) {
      connections.data.forEach(conn => {
        console.log(`  - ${conn.name} (${conn.connectionId})`);
        console.log(`    Status: ${conn.status}`);
        console.log(`    Schedule: ${conn.schedule?.scheduleType || 'manual'}`);
      });
    }
    
  } catch (error) {
    console.error('Error fetching Airbyte resources:', error);
  }
}

checkAirbyteResources().catch(console.error);