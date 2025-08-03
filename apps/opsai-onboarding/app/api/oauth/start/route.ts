import { NextRequest, NextResponse } from 'next/server'
import { oauthFlow } from '@/lib/oauth-flow-complete'

export async function POST(request: NextRequest) {
  try {
    const { provider, tenantId, returnUrl } = await request.json()

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    // Generate OAuth URL
    const authUrl = oauthFlow.generateAuthUrl(
      provider,
      tenantId || 'default',
      returnUrl
    )

    return NextResponse.json({
      success: true,
      authUrl,
      provider
    })

  } catch (error) {
    console.error('OAuth start error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to start OAuth',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}