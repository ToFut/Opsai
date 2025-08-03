import { NextRequest, NextResponse } from 'next/server'

interface OAuthCredential {
  id: string
  provider: string
  accountName: string
  accountId: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: Date
  metadata: any
  createdAt: Date
  updatedAt: Date
}

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')
    const tenantId = searchParams.get('tenant_id')
    
    if (!sessionId && !tenantId) {
      return NextResponse.json(
        { error: 'Session ID or Tenant ID required' },
        { status: 400 }
      )
    }
    
    console.log(`🔍 Checking OAuth status for ${provider}`, { sessionId, tenantId })
    
    // First check session-based credentials (for onboarding flow)
    if (sessionId) {
      // Check temporary session storage
      const sessionKey = `oauth_${provider}_${sessionId}`
      
      // In production, this would check Redis or session storage
      // For now, we'll simulate with a database check
      const sessionCredential = {
        id: `temp_${sessionId}`,
        provider,
        accountName: `${provider} Account`,
        accountId: `${provider}_${sessionId}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
      }
      
      return NextResponse.json({
        success: true,
        credential: sessionCredential,
        isTemporary: true,
        message: `OAuth session found for ${provider}`
      })
    }
    
    // Check tenant-based credentials (for production apps)
    if (tenantId) {
      // Simulate database lookup for tenant OAuth credentials
      const tenantCredentials: OAuthCredential[] = [
        {
          id: `oauth_${tenantId}_${provider}`,
          provider,
          accountName: `${provider} Production Account`,
          accountId: `${provider}_${tenantId}`,
          accessToken: 'encrypted_access_token',
          refreshToken: 'encrypted_refresh_token',
          expiresAt: new Date(Date.now() + 86400000), // 24 hours
          metadata: {
            scope: 'read,write',
            tokenType: 'Bearer'
          },
          createdAt: new Date(Date.now() - 86400000), // Created yesterday
          updatedAt: new Date()
        }
      ]
      
      const credential = tenantCredentials.find(c => c.provider === provider)
      
      if (credential) {
        // Check if token is expired
        const isExpired = credential.expiresAt && new Date(credential.expiresAt) < new Date()
        
        return NextResponse.json({
          success: true,
          credential: {
            ...credential,
            accessToken: undefined, // Don't return sensitive data
            refreshToken: undefined
          },
          isExpired,
          needsRefresh: isExpired,
          message: `OAuth credential found for ${provider}`
        })
      }
    }
    
    // No credentials found
    return NextResponse.json({
      success: false,
      credential: null,
      message: `No OAuth credentials found for ${provider}`,
      requiresAuthentication: true
    })
    
  } catch (error: any) {
    console.error(`❌ Error checking OAuth status for ${params.provider}:`, error)
    return NextResponse.json(
      { error: 'Failed to check OAuth status', details: error.message },
      { status: 500 }
    )
  }
}