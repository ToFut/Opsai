import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/supabase'
import { TenantManager } from '@/lib/tenant-manager'

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()
    
    switch (action) {
      case 'login':
        const loginResult = await auth.signIn(data.email, data.password)
        return NextResponse.json(loginResult)
        
      case 'register':
        const registerResult = await auth.signUp(data.email, data.password, {
          firstName: data.firstName,
          lastName: data.lastName
        })
        return NextResponse.json(registerResult)
        
      case 'logout':
        const logoutResult = await auth.signOut()
        return NextResponse.json(logoutResult)
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}