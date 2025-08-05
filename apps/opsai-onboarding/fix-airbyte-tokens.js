#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const AIRBYTE_CLIENT_ID = process.env.AIRBYTE_CLIENT_ID;
const AIRBYTE_CLIENT_SECRET = process.env.AIRBYTE_CLIENT_SECRET;
const AIRBYTE_API_URL = 'https://api.airbyte.com/v1';
const WORKSPACE_ID = process.env.AIRBYTE_WORKSPACE_ID;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAirbyteToken() {
  const tokenResponse = await fetch('https://api.airbyte.com/v1/applications/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AIRBYTE_CLIENT_ID,
      client_secret: AIRBYTE_CLIENT_SECRET
    })
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function updateGitHubSource() {
  console.log('🔧 Fixing GitHub Source Authentication\n');

  try {
    // 1. Get valid GitHub token from database
    console.log('1️⃣ Getting GitHub token from database...');
    const { data: githubIntegration } = await supabase
      .from('tenant_integrations')
      .select('access_token, tenant_id, connected_at')
      .eq('provider', 'github')
      .eq('status', 'connected')
      .order('connected_at', { ascending: false })
      .limit(1)
      .single();

    if (!githubIntegration || !githubIntegration.access_token) {
      console.log('❌ No valid GitHub integration found. User needs to authenticate first.');
      console.log('\n💡 To fix this:');
      console.log('1. Go to http://localhost:7250/onboarding-v3');
      console.log('2. Connect GitHub account');
      console.log('3. Run this script again');
      return;
    }

    console.log('✅ Found GitHub token from:', githubIntegration.connected_at);
    const githubToken = githubIntegration.access_token;

    // 2. Get Airbyte access token
    console.log('\n2️⃣ Getting Airbyte access token...');
    const airbyteToken = await getAirbyteToken();

    // 3. Find GitHub source
    console.log('\n3️⃣ Finding GitHub source...');
    const sourcesResponse = await fetch(`${AIRBYTE_API_URL}/sources?workspaceId=${WORKSPACE_ID}`, {
      headers: {
        'Authorization': `Bearer ${airbyteToken}`,
        'Accept': 'application/json'
      }
    });
    
    const sourcesData = await sourcesResponse.json();
    const githubSource = sourcesData.data?.find(s => s.name.includes('github'));
    
    if (!githubSource) {
      console.log('❌ GitHub source not found in Airbyte');
      return;
    }

    console.log('✅ Found GitHub source:', githubSource.name);

    // 4. Get current source configuration
    console.log('\n4️⃣ Getting current source configuration...');
    const detailResponse = await fetch(`${AIRBYTE_API_URL}/sources/${githubSource.sourceId}`, {
      headers: {
        'Authorization': `Bearer ${airbyteToken}`,
        'Accept': 'application/json'
      }
    });

    const currentConfig = await detailResponse.json();
    console.log('Current repositories:', currentConfig.configuration.repositories);

    // 5. Update source with real GitHub token
    console.log('\n5️⃣ Updating GitHub source with OAuth token...');
    const updatedConfig = {
      ...currentConfig,
      configuration: {
        ...currentConfig.configuration,
        credentials: {
          personal_access_token: {
            option_title: "PAT Credentials",
            personal_access_token: githubToken
          }
        }
      }
    };

    const updateResponse = await fetch(`${AIRBYTE_API_URL}/sources/${githubSource.sourceId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${airbyteToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updatedConfig)
    });

    if (updateResponse.ok) {
      console.log('✅ GitHub source updated successfully!');
    } else {
      const errorData = await updateResponse.json();
      console.log('❌ Failed to update GitHub source:', errorData);
      return;
    }

    // 6. Test the updated source
    console.log('\n6️⃣ Testing updated source connection...');
    const testResponse = await fetch(`${AIRBYTE_API_URL}/sources/${githubSource.sourceId}/check_connection`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airbyteToken}`,
        'Accept': 'application/json'
      }
    });

    const testResult = await testResponse.json();
    
    if (testResponse.ok && testResult.jobInfo?.succeeded) {
      console.log('✅ GitHub source connection test PASSED!');
      console.log('🎉 GitHub source is now ready for continuous sync');
      
      // Store the successful token update
      await supabase
        .from('tenant_integrations')
        .update({ 
          status: 'connected',
          airbyte_source_id: githubSource.sourceId,
          updated_at: new Date().toISOString()
        })
        .eq('id', githubIntegration.id);

    } else {
      console.log('❌ GitHub source connection test failed:', testResult);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function updateGoogleSource() {
  console.log('\n🔧 Fixing Google Analytics Source Authentication\n');

  try {
    // 1. Get valid Google token from database
    console.log('1️⃣ Getting Google token from database...');
    const { data: googleIntegration } = await supabase
      .from('tenant_integrations')
      .select('access_token, refresh_token, tenant_id, connected_at')
      .eq('provider', 'google')
      .eq('status', 'connected')
      .order('connected_at', { ascending: false })
      .limit(1)
      .single();

    if (!googleIntegration || !googleIntegration.refresh_token) {
      console.log('❌ No valid Google integration found. User needs to authenticate first.');
      return;
    }

    console.log('✅ Found Google token from:', googleIntegration.connected_at);

    // 2. Get Airbyte access token
    const airbyteToken = await getAirbyteToken();

    // 3. Find Google Analytics source
    console.log('\n2️⃣ Finding Google Analytics source...');
    const sourcesResponse = await fetch(`${AIRBYTE_API_URL}/sources?workspaceId=${WORKSPACE_ID}`, {
      headers: {
        'Authorization': `Bearer ${airbyteToken}`,
        'Accept': 'application/json'
      }
    });
    
    const sourcesData = await sourcesResponse.json();
    const googleSource = sourcesData.data?.find(s => s.name.includes('google-analytics'));
    
    if (!googleSource) {
      console.log('❌ Google Analytics source not found in Airbyte');
      return;
    }

    console.log('✅ Found Google Analytics source:', googleSource.name);

    // 4. Update source with real Google refresh token
    console.log('\n3️⃣ Updating Google Analytics source with OAuth token...');
    const detailResponse = await fetch(`${AIRBYTE_API_URL}/sources/${googleSource.sourceId}`, {
      headers: {
        'Authorization': `Bearer ${airbyteToken}`,
        'Accept': 'application/json'
      }
    });

    const currentConfig = await detailResponse.json();
    
    const updatedConfig = {
      ...currentConfig,
      configuration: {
        ...currentConfig.configuration,
        credentials: {
          auth_type: "Client",
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: googleIntegration.refresh_token
        }
      }
    };

    const updateResponse = await fetch(`${AIRBYTE_API_URL}/sources/${googleSource.sourceId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${airbyteToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updatedConfig)
    });

    if (updateResponse.ok) {
      console.log('✅ Google Analytics source updated successfully!');
    } else {
      const errorData = await updateResponse.json();
      console.log('❌ Failed to update Google Analytics source:', errorData);
      return;
    }

    // 5. Test the updated source
    console.log('\n4️⃣ Testing updated Google source connection...');
    const testResponse = await fetch(`${AIRBYTE_API_URL}/sources/${googleSource.sourceId}/check_connection`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airbyteToken}`,
        'Accept': 'application/json'
      }
    });

    const testResult = await testResponse.json();
    
    if (testResponse.ok && testResult.jobInfo?.succeeded) {
      console.log('✅ Google Analytics source connection test PASSED!');
      console.log('🎉 Google Analytics source is now ready for continuous sync');
      
      // Store the successful token update
      await supabase
        .from('tenant_integrations')
        .update({ 
          status: 'connected',
          airbyte_source_id: googleSource.sourceId,
          updated_at: new Date().toISOString()
        })
        .eq('id', googleIntegration.id);

    } else {
      console.log('❌ Google Analytics source connection test failed:', testResult);
    }

  } catch (error) {
    console.error('Error updating Google source:', error.message);
  }
}

async function retryConnections() {
  console.log('\n🔄 Retrying Airbyte Connection Creation\n');

  try {
    const airbyteToken = await getAirbyteToken();

    // Get sources and destination
    const sourcesResponse = await fetch(`${AIRBYTE_API_URL}/sources?workspaceId=${WORKSPACE_ID}`, {
      headers: { 'Authorization': `Bearer ${airbyteToken}`, 'Accept': 'application/json' }
    });
    
    const destResponse = await fetch(`${AIRBYTE_API_URL}/destinations?workspaceId=${WORKSPACE_ID}`, {
      headers: { 'Authorization': `Bearer ${airbyteToken}`, 'Accept': 'application/json' }
    });
    
    const sourcesData = await sourcesResponse.json();
    const destData = await destResponse.json();
    
    const githubSource = sourcesData.data?.find(s => s.name.includes('github'));
    const googleSource = sourcesData.data?.find(s => s.name.includes('google-analytics'));
    const supabaseDest = destData.data?.find(d => d.name.includes('supabase'));

    if (!supabaseDest) {
      console.log('❌ Supabase destination not found');
      return;
    }

    // Try to create GitHub connection
    if (githubSource) {
      console.log('1️⃣ Creating GitHub to Supabase connection...');
      const githubConnectionData = {
        name: `GitHub to Supabase - ${new Date().toISOString()}`,
        sourceId: githubSource.sourceId,
        destinationId: supabaseDest.destinationId,
        namespaceDefinition: 'custom_format',
        namespaceFormat: 'github_data',
        status: 'active',
        schedule: {
          scheduleType: 'cron',
          cronExpression: '0 */4 * * * ?'  // Every 4 hours
        }
      };

      const githubConnResponse = await fetch(`${AIRBYTE_API_URL}/connections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airbyteToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(githubConnectionData)
      });

      if (githubConnResponse.ok) {
        const connData = await githubConnResponse.json();
        console.log('✅ GitHub connection created:', connData.connectionId);
      } else {
        const errorData = await githubConnResponse.json();
        console.log('❌ GitHub connection failed:', errorData);
      }
    }

    // Try to create Google Analytics connection
    if (googleSource) {
      console.log('\n2️⃣ Creating Google Analytics to Supabase connection...');
      const googleConnectionData = {
        name: `Google Analytics to Supabase - ${new Date().toISOString()}`,
        sourceId: googleSource.sourceId,
        destinationId: supabaseDest.destinationId,
        namespaceDefinition: 'custom_format',
        namespaceFormat: 'google_analytics',
        status: 'active',
        schedule: {
          scheduleType: 'cron',
          cronExpression: '0 0 * * * ?'  // Daily
        }
      };

      const googleConnResponse = await fetch(`${AIRBYTE_API_URL}/connections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airbyteToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(googleConnectionData)
      });

      if (googleConnResponse.ok) {
        const connData = await googleConnResponse.json();
        console.log('✅ Google Analytics connection created:', connData.connectionId);
      } else {
        const errorData = await googleConnResponse.json();
        console.log('❌ Google Analytics connection failed:', errorData);
      }
    }

  } catch (error) {
    console.error('Error retrying connections:', error.message);
  }
}

async function main() {
  console.log('🚀 Fixing Airbyte OAuth Token Integration\n');
  
  await updateGitHubSource();
  await updateGoogleSource();
  await retryConnections();
  
  console.log('\n🎉 Fix Complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Test the onboarding flow: http://localhost:7250/onboarding-v3');
  console.log('2. Check that continuous sync is working');
  console.log('3. Verify data appears in Supabase tables');
}

main();