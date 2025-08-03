import { NextRequest, NextResponse } from 'next/server'
import { airbyteAPI } from '@/lib/airbyte-api-v2'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceType, name, configuration, secretId } = body
    
    if (!sourceType || !name) {
      return NextResponse.json(
        { error: 'sourceType and name are required' },
        { status: 400 }
      )
    }

    console.log(`🔧 Creating ${sourceType} source: ${name}`)

    let result

    if (secretId) {
      // OAuth source - use secretId from OAuth flow
      result = await airbyteAPI.completeOAuthSource(
        sourceType,
        name,
        secretId,
        configuration
      )
    } else {
      // Direct source - use provided configuration
      if (!configuration) {
        return NextResponse.json(
          { error: 'configuration is required for non-OAuth sources' },
          { status: 400 }
        )
      }

      result = await airbyteAPI.createDirectSource(
        sourceType,
        name,
        configuration
      )
    }

    console.log(`✅ Source created: ${result.sourceId}`)

    return NextResponse.json({
      success: true,
      sourceId: result.sourceId,
      source: result
    })

  } catch (error) {
    console.error('❌ Source creation failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create source',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}