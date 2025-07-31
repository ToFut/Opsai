import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const Customers = await prisma.Customer.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(Customers)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const Customer = await prisma.Customer.create({
      data
    })
    
    return NextResponse.json(Customer, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create Customer' },
      { status: 500 }
    )
  }
}