import { NextRequest, NextResponse } from 'next/server'
import { TenantManager } from '@opsai/multi-tenant'
import { AuthService } from '@opsai/auth'

const tenantManager = TenantManager.getInstance(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { name, slug } = await request.json()
    
    const tenant = await tenantManager.createTenant({
      name,
      slug,
      status: 'active',
      settings: {
        timezone: 'UTC',
        currency: 'USD',
        language: 'en'
      },
      config: {} // Will be set later
    })
    
    // Setup tenant database schema
    await tenantManager.setupTenantDatabase(tenant.id, {} as any)
    
    // Enable row-level security
    await tenantManager.enableRLS(tenant.id)
    
    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }
    
    const tenant = await tenantManager.getTenant(tenantId)
    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 })
  }
}