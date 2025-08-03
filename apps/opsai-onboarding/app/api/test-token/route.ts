import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Check environment variables
  const hasClientId = !!process.env.AIRBYTE_CLIENT_ID
  const hasClientSecret = !!process.env.AIRBYTE_CLIENT_SECRET
  
  if (!hasClientId || !hasClientSecret) {
    return NextResponse.json({
      error: 'Missing credentials',
      hasClientId,
      hasClientSecret,
      message: 'Add AIRBYTE_CLIENT_ID and AIRBYTE_CLIENT_SECRET to .env.local'
    })
  }
  
  try {
    // Try to get token directly
    const response = await fetch(
      'https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.AIRBYTE_CLIENT_ID,
          client_secret: process.env.AIRBYTE_CLIENT_SECRET
        }).toString()
      }
    )
    
    const data = await response.json()
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data: response.ok ? {
        tokenPreview: data.access_token ? data.access_token.substring(0, 50) + '...' : 'No token',
        expiresIn: data.expires_in,
        tokenType: data.token_type
      } : data
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}