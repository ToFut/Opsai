import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@opsai/auth'
import { TenantManager } from '@opsai/multi-tenant'

const authService = new AuthService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  jwtSecret: process.env.JWT_SECRET!
})

const tenantManager = TenantManager.getInstance(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()
    
    switch (action) {
      case 'login':
        const loginResult = await authService.login(data)
        return NextResponse.json(loginResult)
        
      case 'register':
        const registerResult = await authService.register(data)
        return NextResponse.json(registerResult)
        
      case 'logout':
        await authService.logout(data.token)
        return NextResponse.json({ success: true })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}