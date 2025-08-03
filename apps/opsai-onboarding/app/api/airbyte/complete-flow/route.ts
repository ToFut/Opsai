import { NextRequest, NextResponse } from 'next/server'
import { airbyteClient, AirbyteClient } from '@/lib/airbyte-client'

// Complete Airbyte Flow: Source -> Destination -> Connection -> Sync
export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()

    switch (action) {
      case 'list-sources':
        return await listAvailableSources()
      
      case 'list-destinations':
        return await listAvailableDestinations()
      
      case 'create-source':
        return await createSource(params)
      
      case 'create-destination':
        return await createDestination(params)
      
      case 'create-connection':
        return await createConnection(params)
      
      case 'trigger-sync':
        return await triggerSync(params)
      
      case 'get-oauth-url':
        return await getOAuthUrl(params)
      
      case 'complete-oauth':
        return await completeOAuth(params)
      
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Airbyte flow error:', error)
    return NextResponse.json({ 
      error: 'Operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// List available source types
async function listAvailableSources() {
  console.log('🔍 Listing available sources...')
  console.log('API URL:', process.env.AIRBYTE_API_URL)
  console.log('API Key exists:', !!process.env.AIRBYTE_API_KEY)
  console.log('Workspace ID:', process.env.AIRBYTE_WORKSPACE_ID)

  try {
    const definitions = await airbyteClient.listSourceDefinitions()
    console.log('✅ Got source definitions:', definitions?.sourceDefinitions?.length || 0)
    
    // Filter and format for easier use
    const sources = definitions.sourceDefinitions
      .filter((def: any) => def.releaseStage === 'generally_available')
      .map((def: any) => ({
        sourceDefinitionId: def.sourceDefinitionId,
        name: def.name,
        dockerRepository: def.dockerRepository,
        dockerImageTag: def.dockerImageTag,
        icon: def.icon,
        requiresOAuth: hasOAuthSupport(def)
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    console.log('📊 Filtered sources:', sources.length)
    return NextResponse.json({ sources })
  } catch (error) {
    console.error('❌ Error listing sources:', error)
    throw error
  }
}

// List available destination types
async function listAvailableDestinations() {
  const definitions = await airbyteClient.listDestinationDefinitions()
  
  const destinations = definitions.destinationDefinitions
    .filter((def: any) => def.releaseStage === 'generally_available')
    .map((def: any) => ({
      destinationDefinitionId: def.destinationDefinitionId,
      name: def.name,
      dockerRepository: def.dockerRepository,
      dockerImageTag: def.dockerImageTag,
      icon: def.icon
    }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name))

  return NextResponse.json({ destinations })
}

// Create a source
async function createSource(params: any) {
  const { sourceType, name, config } = params
  
  // Get source definition ID
  const sourceDefId = getSourceDefinitionId(sourceType)
  if (!sourceDefId) {
    return NextResponse.json({ error: 'Unknown source type' }, { status: 400 })
  }

  // Get default config and ensure it's not empty
  const defaultConfig = AirbyteClient.getSourceConfig(sourceType)
  
  // Merge with provided config
  const connectionConfiguration = {
    ...defaultConfig,
    ...config
  }

  console.log(`🔧 Creating ${sourceType} source with config:`, connectionConfiguration)

  try {
    const source = await airbyteClient.createSource(
      name || `${sourceType}-${Date.now()}`,
      sourceDefId,
      connectionConfiguration
    )

    return NextResponse.json({ 
      success: true,
      sourceId: source.sourceId,
      source 
    })
  } catch (error) {
    console.error(`❌ Failed to create ${sourceType} source:`, error)
    return NextResponse.json({ 
      error: 'Failed to create source',
      details: error instanceof Error ? error.message : 'Unknown error',
      sourceType,
      config: connectionConfiguration
    }, { status: 500 })
  }
}

// Create a destination
async function createDestination(params: any) {
  const { destinationType, name, config } = params
  
  // Get destination definition ID
  const destDefId = getDestinationDefinitionId(destinationType)
  if (!destDefId) {
    return NextResponse.json({ error: 'Unknown destination type' }, { status: 400 })
  }

  // Merge with default config
  const connectionConfiguration = {
    ...AirbyteClient.getDestinationConfig(destinationType),
    ...config
  }

  const destination = await airbyteClient.createDestination(
    name || `${destinationType}-${Date.now()}`,
    destDefId,
    connectionConfiguration
  )

  return NextResponse.json({ 
    success: true,
    destinationId: destination.destinationId,
    destination 
  })
}

// Create a connection between source and destination
async function createConnection(params: any) {
  const { sourceId, destinationId, streams = [], name } = params
  
  const connection = await airbyteClient.createConnection(
    sourceId,
    destinationId,
    streams,
    name
  )

  return NextResponse.json({ 
    success: true,
    connectionId: connection.connectionId,
    connection 
  })
}

// Trigger a sync
async function triggerSync(params: any) {
  const { connectionId } = params
  
  const job = await airbyteClient.triggerSync(connectionId)

  return NextResponse.json({ 
    success: true,
    jobId: job.job.id,
    job 
  })
}

// Get OAuth URL for a source
async function getOAuthUrl(params: any) {
  const { sourceType } = params
  
  const sourceDefId = getSourceDefinitionId(sourceType)
  if (!sourceDefId) {
    return NextResponse.json({ error: 'Unknown source type' }, { status: 400 })
  }

  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7250'}/oauth-success`
  
  // Special handling for GitHub
  if (sourceType === 'github' && process.env.GITHUB_CLIENT_ID) {
    const state = Buffer.from(JSON.stringify({
      provider: 'github',
      sourceDefinitionId: sourceDefId
    })).toString('base64')
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${process.env.GITHUB_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
      `scope=repo,user,read:org&` +
      `state=${state}`
    
    return NextResponse.json({
      authUrl: githubAuthUrl,
      provider: 'github'
    })
  }

  // Use Airbyte OAuth for other providers
  try {
    const result = await airbyteClient.initiateOAuth(
      sourceDefId,
      redirectUrl,
      getOAuthConfig(sourceType)
    )

    return NextResponse.json({
      authUrl: result.consentUrl,
      provider: sourceType
    })
  } catch (error) {
    console.error('OAuth initiation failed:', error)
    return NextResponse.json({ 
      error: 'Failed to initiate OAuth',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Complete OAuth flow
async function completeOAuth(params: any) {
  const { code, state, provider } = params
  
  // Parse state
  let sourceDefinitionId = ''
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    sourceDefinitionId = stateData.sourceDefinitionId
  } catch (e) {
    console.warn('Could not parse state')
  }

  // Special handling for GitHub
  if (provider === 'github') {
    // Exchange code with GitHub
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
    
    return NextResponse.json({
      success: true,
      provider: 'github',
      credentials: {
        option_title: 'PAT Credentials',
        personal_access_token: tokenData.access_token
      }
    })
  }

  // Use Airbyte OAuth for other providers
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7250'}/oauth-success`
  const result = await airbyteClient.completeOAuth(
    sourceDefinitionId,
    redirectUrl,
    { code, state }
  )

  return NextResponse.json({
    success: true,
    provider,
    credentials: result.authPayload
  })
}

// Helper functions
function getSourceDefinitionId(sourceType: string): string {
  const sourceMap: Record<string, string> = {
    'postgres': 'decd338e-5647-4c0b-adf4-da0e75f5a750',
    'mysql': '435bb9a5-7887-4809-aa58-28c27df0d7ad',
    'github': 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
    'shopify': '9da77001-af33-4bcd-be46-6252bf9342b9',
    'stripe': 'e094cb9a-26de-4645-8761-65c0c425d1de',
    'google-sheets': '71607ba1-c0ac-4799-8049-7f4b90dd50f7',
    'salesforce': 'b117307c-14b6-41aa-9422-947e34922962',
    'hubspot': '36c891d9-4bd9-43ac-bad2-10e12756272c'
  }
  return sourceMap[sourceType] || ''
}

function getDestinationDefinitionId(destinationType: string): string {
  const destMap: Record<string, string> = {
    'postgres': '25c5221d-dce2-4163-ade9-739ef790f503',
    'bigquery': '22f6c74f-5699-40ff-833c-4a879ea40133',
    'snowflake': '424892c4-daac-4491-b35d-c6688ba547ba',
    's3': '4816b78f-1489-44c1-9060-4b19d5fa9362',
    'mysql': 'ca81ee7c-3163-4246-af40-094cc31e5e42',
    'redshift': 'f7a7d195-377f-cf5b-70a5-be6b819019dc'
  }
  return destMap[destinationType] || ''
}

function getOAuthConfig(sourceType: string): any {
  switch (sourceType) {
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

function hasOAuthSupport(definition: any): boolean {
  // Check if the source definition supports OAuth
  const spec = definition.connectionSpecification
  if (!spec || !spec.properties) return false
  
  const hasAuthField = Object.keys(spec.properties).some(key => 
    key.includes('credentials') || key.includes('auth')
  )
  
  if (hasAuthField && spec.properties.credentials?.oneOf) {
    return spec.properties.credentials.oneOf.some((method: any) => 
      method.properties?.auth_type?.const === 'OAuth2.0' ||
      method.title?.includes('OAuth')
    )
  }
  
  return false
}