import { NextRequest, NextResponse } from 'next/server'
import { supabase } from './supabase'
import type { UserMetadata } from '@/types'

export interface AuthUser {
  id: string
  email: string
  metadata?: UserMetadata
}

export interface AuthRequest extends NextRequest {
  user?: AuthUser
}

// Authentication middleware
export async function requireAuth(
  request: NextRequest,
  handler: (req: AuthRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Add user to request
    const authRequest = request as AuthRequest
    authRequest.user = {
      id: user.id,
      email: user.email!,
      metadata: user.user_metadata
    }

    // Call the handler with authenticated request
    return handler(authRequest)

  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Optional auth middleware (doesn't require auth but adds user if present)
export async function optionalAuth(
  request: NextRequest,
  handler: (req: AuthRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (user) {
        const authRequest = request as AuthRequest
        authRequest.user = {
          id: user.id,
          email: user.email!,
          metadata: user.user_metadata
        }
      }
    }

    return handler(request as AuthRequest)
  } catch (error) {
    // Continue without auth if it fails
    return handler(request as AuthRequest)
  }
}

// Validate request body
export function validateBody<T>(
  body: any,
  requiredFields: (keyof T)[]
): { valid: boolean; errors?: string[] } {
  const errors: string[] = []

  for (const field of requiredFields) {
    if (!body[field]) {
      errors.push(`Missing required field: ${String(field)}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(identifier)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }

  if (userLimit.count >= maxRequests) {
    return false
  }

  userLimit.count++
  return true
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 300000) // Clean up every 5 minutes