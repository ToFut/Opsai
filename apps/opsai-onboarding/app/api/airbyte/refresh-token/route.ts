import { NextRequest, NextResponse } from 'next/server'
import { tokenManager, decodeJWT, isTokenExpired } from '@/lib/airbyte-token-manager'

export async function GET(request: NextRequest) {
  console.log('🔑 Testing Airbyte token refresh...')

  const staticToken = process.env.AIRBYTE_API_KEY
  const clientId = process.env.AIRBYTE_CLIENT_ID
  const clientSecret = process.env.AIRBYTE_CLIENT_SECRET

  // Check static token
  let tokenInfo = null
  if (staticToken) {
    const decoded = decodeJWT(staticToken)
    tokenInfo = {
      isExpired: isTokenExpired(staticToken),
      expiresAt: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : 'Unknown',
      issuedAt: decoded?.iat ? new Date(decoded.iat * 1000).toISOString() : 'Unknown',
      clientId: decoded?.azp || decoded?.client_id || 'Unknown'
    }
  }

  // Try to refresh token
  let refreshResult = null
  if (clientId && clientSecret) {
    try {
      const newToken = await tokenManager.refreshToken()
      const tokenStatus = tokenManager.getTokenInfo()
      
      refreshResult = {
        success: true,
        tokenReceived: !!newToken,
        tokenLength: newToken?.length || 0,
        isValid: tokenStatus.isValid,
        expiresIn: tokenStatus.expiresIn
      }
    } catch (error) {
      refreshResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  return NextResponse.json({
    staticToken: {
      exists: !!staticToken,
      info: tokenInfo
    },
    clientCredentials: {
      clientId: clientId ? 'Set' : 'NOT SET',
      clientSecret: clientSecret ? 'Set' : 'NOT SET'
    },
    refreshResult,
    recommendations: [
      'Airbyte tokens expire after 15 minutes',
      'Use AIRBYTE_CLIENT_ID and AIRBYTE_CLIENT_SECRET for auto-refresh',
      'The system will automatically refresh tokens when needed'
    ]
  })
}