import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json()
    
    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      )
    }

    console.log('🔄 Exchanging GitHub OAuth code for access token')

    // Exchange code for access token directly with GitHub
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
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error)
    }

    console.log('✅ Successfully obtained GitHub access token')

    // Verify the token works by getting user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!userResponse.ok) {
      throw new Error('Failed to verify GitHub token')
    }

    const userData = await userResponse.json()
    console.log(`✅ Verified token for GitHub user: ${userData.login}`)

    // Parse state to get tenant info
    let tenantId = 'unknown'
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      tenantId = stateData.tenantId
    } catch (e) {
      console.warn('Could not parse state data')
    }

    // Return success with token info
    return NextResponse.json({
      success: true,
      provider: 'github',
      accountName: userData.name || userData.login || 'GitHub Account',
      accessToken: tokenData.access_token,
      tokenType: tokenData.token_type || 'bearer',
      scope: tokenData.scope,
      user: {
        login: userData.login,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url
      },
      tenantId: tenantId,
      message: 'GitHub OAuth completed successfully. You can now create a source in Airbyte using this token.'
    })

  } catch (error) {
    console.error('❌ GitHub OAuth exchange failed:', error)
    return NextResponse.json(
      { 
        error: 'OAuth exchange failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}