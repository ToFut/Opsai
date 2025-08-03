import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code, state, provider } = await request.json()
    
    const AIRBYTE_API_URL = process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
    const AIRBYTE_API_KEY = process.env.AIRBYTE_API_KEY
    const AIRBYTE_WORKSPACE_ID = process.env.AIRBYTE_WORKSPACE_ID

    console.log('🔄 Completing OAuth for:', provider)

    // Parse state to get source definition ID
    let sourceDefinitionId = ''
    let tenantId = ''
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      sourceDefinitionId = stateData.sourceDefinitionId
      tenantId = stateData.tenantId
    } catch (e) {
      console.warn('Could not parse state')
    }

    // For GitHub, use direct token exchange
    if (provider === 'github') {
      console.log('🐙 Using direct GitHub token exchange')
      
      // Exchange code with GitHub directly
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code
        })
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange GitHub code')
      }

      const tokenData = await tokenResponse.json()
      
      // Now create the source in Airbyte with the token
      const createResponse = await fetch(`${AIRBYTE_API_URL}/sources`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRBYTE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          workspaceId: AIRBYTE_WORKSPACE_ID,
          name: `github-${tenantId}-${Date.now()}`,
          sourceDefinitionId: 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
          connectionConfiguration: {
            start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            credentials: {
              option_title: 'PAT Credentials',
              personal_access_token: tokenData.access_token
            },
            repositories: [],
            page_size_for_large_streams: 100
          }
        })
      })

      if (!createResponse.ok) {
        const error = await createResponse.text()
        console.error('Failed to create GitHub source:', error)
        throw new Error('Failed to create source in Airbyte')
      }

      const source = await createResponse.json()
      
      return NextResponse.json({
        success: true,
        sourceId: source.sourceId,
        provider: 'github',
        message: 'GitHub source created successfully'
      })
    }

    // For other OAuth providers, use Airbyte's complete endpoint
    const completeResponse = await fetch(`${AIRBYTE_API_URL}/source_oauths/complete_oauth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        workspaceId: AIRBYTE_WORKSPACE_ID,
        sourceDefinitionId: sourceDefinitionId,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6060'}/oauth-success`,
        queryParams: {
          code: code,
          state: state
        }
      })
    })

    if (!completeResponse.ok) {
      const error = await completeResponse.text()
      console.error('OAuth completion error:', error)
      throw new Error('Failed to complete OAuth')
    }

    const result = await completeResponse.json()
    
    // Create the source with OAuth credentials
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
        connectionConfiguration: {
          ...getBasicConfig(provider),
          ...result.authPayload
        }
      })
    })

    if (!createResponse.ok) {
      const error = await createResponse.text()
      throw new Error(`Failed to create source: ${error}`)
    }

    const source = await createResponse.json()
    
    return NextResponse.json({
      success: true,
      sourceId: source.sourceId,
      provider: provider,
      message: 'Source created successfully'
    })

  } catch (error) {
    console.error('OAuth completion error:', error)
    return NextResponse.json({ 
      error: 'OAuth completion failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getBasicConfig(provider: string): any {
  const now = new Date()
  const startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  
  switch (provider) {
    case 'shopify':
      return {
        start_date: startDate.toISOString().split('T')[0],
        shop: ''
      }
    case 'stripe':
      return {
        start_date: startDate.toISOString().split('T')[0],
        lookback_window_days: 7,
        slice_range: 365
      }
    default:
      return {
        start_date: startDate.toISOString().split('T')[0]
      }
  }
}