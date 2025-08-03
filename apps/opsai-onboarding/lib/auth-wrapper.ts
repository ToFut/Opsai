// Simple auth wrapper for API routes that need authentication
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthRequest } from './auth-middleware'

export function withAuth(
  handler: (request: AuthRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    return requireAuth(request, handler)
  }
}