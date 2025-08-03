import { NextRequest, NextResponse } from 'next/server'

// Simplified Airbyte connection - just the essentials
export async function POST(request: NextRequest) {
  try {
    const { provider, tenantId } = await request.json()
    
    const AIRBYTE_API_URL = process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
    const AIRBYTE_API_KEY = process.env.AIRBYTE_API_KEY
    const AIRBYTE_WORKSPACE_ID = process.env.AIRBYTE_WORKSPACE_ID

    if (!AIRBYTE_API_KEY || !AIRBYTE_WORKSPACE_ID) {
      return NextResponse.json({
        error: 'Missing Airbyte configuration',
        setup: 'Add AIRBYTE_API_KEY and AIRBYTE_WORKSPACE_ID to .env.local'
      }, { status: 400 })
    }

    // Source definition IDs from Airbyte docs
    const SOURCE_DEFINITIONS: Record<string, string> = {
      'github': 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
      'shopify': '9da77001-af33-4bcd-be46-6252bf9342b9',
      'stripe': 'e094cb9a-26de-4645-8761-65c0c425d1de',
      'google-sheets': '71607ba1-c0ac-4799-8049-7f4b90dd50f7',
      'postgres': 'decd338e-5647-4c0b-adf4-da0e75f5a750',
      'mysql': '435bb9a5-7887-4809-aa58-28c27df0d7ad'
    }

    const sourceDefinitionId = SOURCE_DEFINITIONS[provider]
    if (!sourceDefinitionId) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
    }

    // For OAuth providers, return the consent URL
    const oauthProviders = ['github', 'shopify', 'stripe', 'google-sheets']
    if (oauthProviders.includes(provider)) {
      try {
        // Step 1: Get OAuth consent URL from Airbyte
        const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6060'}/oauth-success`
        console.log('🔑 Getting OAuth consent URL for:', provider)
        console.log('📍 Redirect URL:', redirectUrl)
        
        const requestBody = {
          workspaceId: AIRBYTE_WORKSPACE_ID,
          sourceDefinitionId: sourceDefinitionId,
          redirectUrl: redirectUrl,
          oAuthInputConfiguration: getOAuthConfig(provider),
          sourceType: provider
        }
        
        console.log('📤 Request:', JSON.stringify(requestBody, null, 2))
        
        const consentResponse = await fetch(`${AIRBYTE_API_URL}/source_oauths/get_consent_url`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRBYTE_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        if (!consentResponse.ok) {
          const error = await consentResponse.text()
          console.error('Consent URL error:', error)
          
          // Fallback to direct OAuth for GitHub
          if (provider === 'github') {
            const state = Buffer.from(JSON.stringify({
              provider: 'github',
              tenantId: tenantId,
              sourceDefinitionId: sourceDefinitionId
            })).toString('base64')
            
            const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
              `client_id=${process.env.GITHUB_CLIENT_ID}&` +
              `redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6060'}/oauth-success`)}&` +
              `scope=repo,user,read:org&` +
              `state=${state}`
            
            return NextResponse.json({
              requiresAuth: true,
              authUrl: githubAuthUrl,
              provider: provider,
              message: 'Using direct GitHub OAuth'
            })
          }
          
          return NextResponse.json({ 
            error: 'Failed to get consent URL',
            details: error 
          }, { status: 500 })
        }

        const consentData = await consentResponse.json()
        
        return NextResponse.json({
          requiresAuth: true,
          authUrl: consentData.consentUrl,
          provider: provider
        })

      } catch (error) {
        console.error('OAuth setup error:', error)
        return NextResponse.json({ 
          error: 'OAuth setup failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    // For non-OAuth sources (databases), create directly
    const connectionConfig = getBasicConfig(provider)
    
    const createResponse = await fetch(`${AIRBYTE_API_URL}/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        workspaceId: AIRBYTE_WORKSPACE_ID,
        name: `${provider}-${tenantId}-${Date.now()}`,
        sourceDefinitionId: sourceDefinitionId,
        connectionConfiguration: connectionConfig
      })
    })

    if (!createResponse.ok) {
      const error = await createResponse.text()
      return NextResponse.json({ 
        error: 'Failed to create source',
        details: error 
      }, { status: 500 })
    }

    const source = await createResponse.json()
    
    return NextResponse.json({
      success: true,
      sourceId: source.sourceId,
      provider: provider,
      requiresConfig: true,
      message: 'Source created. Configure connection details in Airbyte UI.'
    })

  } catch (error) {
    console.error('Connection error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getOAuthConfig(provider: string): any {
  // Minimal OAuth config based on provider
  switch (provider) {
    case 'github':
      return {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET
      }
    case 'google-sheets':
      return {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET
      }
    default:
      return {}
  }
}

function getBasicConfig(provider: string): any {
  // Basic config for non-OAuth sources
  const now = new Date()
  const startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  
  switch (provider) {
    case 'postgres':
      return {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        username: 'postgres',
        password: 'password',
        ssl_mode: { mode: 'prefer' },
        replication_method: { method: 'Standard' },
        tunnel_method: { tunnel_method: 'NO_TUNNEL' }
      }
    case 'mysql':
      return {
        host: 'localhost',
        port: 3306,
        database: 'mysql',
        username: 'root',
        password: 'password',
        ssl_mode: { mode: 'preferred' },
        replication_method: { method: 'STANDARD' }
      }
    default:
      return {
        start_date: startDate.toISOString().split('T')[0]
      }
  }
}