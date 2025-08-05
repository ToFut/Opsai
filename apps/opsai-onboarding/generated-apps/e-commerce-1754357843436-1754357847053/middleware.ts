import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/api/auth']
  
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Check for auth token
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  // For now, we'll do simple token validation
  // In production, you should verify the JWT properly
  try {
    // Simple validation - just check if token exists
    // You can add proper JWT verification here using jsonwebtoken package
    if (token && token.length > 0) {
      // Add placeholder user info to headers for API routes
      const response = NextResponse.next()
      response.headers.set('x-user-id', 'user-1')
      response.headers.set('x-tenant-id', 'tenant-1')
      
      return response
    } else {
      throw new Error('Invalid token')
    }
  } catch (error) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}