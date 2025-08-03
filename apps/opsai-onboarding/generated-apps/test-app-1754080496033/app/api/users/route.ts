import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get tenant ID from headers (set by middleware)
    const tenantId = request.headers.get('x-tenant-id')
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }
    
    const users = await prisma.user.findMany({
      where: { tenantId },
      include: {
        tenant: {
          select: { name: true, slug: true }
        }
      }
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching Users:', error)
    return NextResponse.json({ error: 'Failed to fetch Users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get tenant ID from headers (set by middleware)
    const tenantId = request.headers.get('x-tenant-id')
    const userId = request.headers.get('x-user-id')
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }
    
    const data = await request.json()
    
    // Ensure tenant isolation
    const user = await prisma.user.create({
      data: {
        ...data,
        tenantId // Always set tenant ID
      },
      include: {
        tenant: {
          select: { name: true, slug: true }
        }
      }
    })
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating User:', error)
    return NextResponse.json({ error: 'Failed to create User' }, { status: 500 })
  }
}