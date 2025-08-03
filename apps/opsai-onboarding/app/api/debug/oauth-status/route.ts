import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Check environment configuration
  const config = {
    github: {
      clientId: !!process.env.GITHUB_CLIENT_ID,
      clientSecret: !!process.env.GITHUB_CLIENT_SECRET,
      clientIdValue: process.env.GITHUB_CLIENT_ID?.substring(0, 10) + '...',
    },
    airbyte: {
      apiUrl: !!process.env.AIRBYTE_API_URL,
      apiKey: !!process.env.AIRBYTE_API_KEY,
      workspaceId: !!process.env.AIRBYTE_WORKSPACE_ID,
      apiKeyValue: process.env.AIRBYTE_API_KEY?.substring(0, 10) + '...',
    },
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  }

  // Test Airbyte API connection if configured
  let airbyteStatus = 'Not configured'
  if (config.airbyte.apiKey && config.airbyte.workspaceId) {
    try {
      const response = await fetch(`${process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'}/workspaces/${process.env.AIRBYTE_WORKSPACE_ID}`, {
        headers: {
          'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        airbyteStatus = '✅ Connected'
      } else if (response.status === 401) {
        airbyteStatus = '❌ Unauthorized - Invalid or expired API key'
      } else {
        airbyteStatus = `❌ Error: ${response.status} ${response.statusText}`
      }
    } catch (error) {
      airbyteStatus = `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  // Get GitHub source definition ID
  const githubSourceDefId = 'ef69ef6e-aa7f-4af1-a01d-ef775033524e'

  return NextResponse.json({
    status: 'OAuth Debug Status',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7250'
    },
    configuration: config,
    airbyteConnection: airbyteStatus,
    githubOAuth: {
      sourceDefinitionId: githubSourceDefId,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7250'}/oauth-success`,
      alternativeFlow: 'Enabled - Direct GitHub token exchange',
      endpoints: {
        createUrl: '/api/oauth/create-url',
        exchangeToken: '/api/oauth/exchange-token',
        githubDirect: '/api/oauth/github/exchange'
      }
    },
    instructions: {
      testGitHub: [
        '1. Visit http://localhost:7250/onboarding',
        '2. Navigate to the integrations step',
        '3. Click on GitHub connector',
        '4. Click "Connect" button',
        '5. Authorize the GitHub OAuth App',
        '6. Check browser console for success messages'
      ],
      troubleshooting: [
        'If you see "Unauthorized" errors, the Airbyte API token may be expired',
        'The GitHub flow now bypasses Airbyte API and exchanges tokens directly',
        'Check localStorage for "oauth_success" key after authorization',
        'Ensure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set in .env.local'
      ]
    }
  })
}