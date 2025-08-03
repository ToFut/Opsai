import { NextRequest, NextResponse } from 'next/server'
import { airbyteAPI } from '@/lib/airbyte-api-v2'

export async function POST(request: NextRequest) {
  try {
    const { sourceType, redirectUrl } = await request.json()
    
    if (!sourceType) {
      return NextResponse.json(
        { error: 'sourceType is required' },
        { status: 400 }
      )
    }

    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID not configured' },
        { status: 400 }
      )
    }

    // Use the provided redirectUrl or default
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7250'
    const finalRedirectUrl = redirectUrl && redirectUrl.startsWith('http') 
      ? redirectUrl 
      : `${baseUrl}/oauth-callback`

    console.log(`🚀 Initiating OAuth for ${sourceType}`)
    console.log(`📍 Redirect URL: ${finalRedirectUrl}`)

    const result = await airbyteAPI.initiateOAuth({
      sourceType,
      workspaceId,
      redirectUrl: finalRedirectUrl
    })

    return NextResponse.json({
      success: true,
      consentUrl: result.consentUrl,
      instructions: 'Redirect the user to consentUrl to complete OAuth authentication'
    })

  } catch (error) {
    console.error('❌ OAuth initiation failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initiate OAuth',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}