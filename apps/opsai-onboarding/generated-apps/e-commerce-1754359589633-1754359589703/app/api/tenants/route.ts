import { NextRequest, NextResponse } from 'next/server'
import { TenantManager } from '@/lib/tenant-manager'

export async function POST(request: NextRequest) {
  try {
    const { name, industry, type, description } = await request.json()
    
    const tenantId = await TenantManager.createTenant({
      name,
      industry: industry || 'general',
      type: type || 'b2b',
      description
    })
    
    return NextResponse.json({ id: tenantId, name, industry, type })
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