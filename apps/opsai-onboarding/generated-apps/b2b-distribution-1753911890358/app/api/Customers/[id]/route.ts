import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const Customer = await prisma.Customer.findUnique({
      where: { id: params.id }
    })
    
    if (!Customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(Customer)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Customer' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    const Customer = await prisma.Customer.update({
      where: { id: params.id },
      data
    })
    
    return NextResponse.json(Customer)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update Customer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.Customer.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete Customer' },
      { status: 500 }
    )
  }
}