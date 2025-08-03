// Airbyte Token Manager - Handles automatic token refresh
// Uses OAuth 2.0 Client Credentials flow

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope?: string
}

interface CachedToken {
  token: string
  expiresAt: number
}

class AirbyteTokenManager {
  private static instance: AirbyteTokenManager
  private cachedToken: CachedToken | null = null
  private tokenEndpoint = 'https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token'
  
  private constructor() {}

  static getInstance(): AirbyteTokenManager {
    if (!AirbyteTokenManager.instance) {
      AirbyteTokenManager.instance = new AirbyteTokenManager()
    }
    return AirbyteTokenManager.instance
  }

  async getValidToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60000) { // 1 minute buffer
      console.log('✅ Using cached Airbyte token')
      return this.cachedToken.token
    }

    // Check if we have client credentials
    const clientId = process.env.AIRBYTE_CLIENT_ID
    const clientSecret = process.env.AIRBYTE_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      console.warn('⚠️ No Airbyte OAuth credentials found, using static token')
      // Fall back to static token from env
      return process.env.AIRBYTE_API_KEY || ''
    }

    console.log('🔄 Refreshing Airbyte token...')
    
    try {
      // Get new token using client credentials
      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'openid email profile'
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('❌ Token refresh failed:', error)
        throw new Error(`Failed to refresh token: ${response.status}`)
      }

      const data: TokenResponse = await response.json()
      
      // Cache the new token
      this.cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000)
      }

      console.log(`✅ Token refreshed, expires in ${data.expires_in} seconds`)
      return data.access_token

    } catch (error) {
      console.error('❌ Failed to refresh token:', error)
      // Fall back to static token
      return process.env.AIRBYTE_API_KEY || ''
    }
  }

  // Force refresh token
  async refreshToken(): Promise<string> {
    this.cachedToken = null
    return this.getValidToken()
  }

  // Get token info
  getTokenInfo(): { isValid: boolean; expiresIn?: number } {
    if (!this.cachedToken) {
      return { isValid: false }
    }

    const now = Date.now()
    if (this.cachedToken.expiresAt <= now) {
      return { isValid: false }
    }

    return {
      isValid: true,
      expiresIn: Math.floor((this.cachedToken.expiresAt - now) / 1000)
    }
  }
}

export const tokenManager = AirbyteTokenManager.getInstance()

// Helper function to decode JWT token
export function decodeJWT(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8')
    return JSON.parse(payload)
  } catch (error) {
    return null
  }
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token)
  if (!decoded || !decoded.exp) return true
  
  const now = Math.floor(Date.now() / 1000)
  return decoded.exp < now
}