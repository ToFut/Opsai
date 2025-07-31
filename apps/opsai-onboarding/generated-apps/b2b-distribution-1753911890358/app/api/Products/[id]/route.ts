import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const Product = await prisma.Product.findUnique({
      where: { id: params.id }
    })
    
    if (!Product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(Product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Product' },
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
    
    const Product = await prisma.Product.update({
      where: { id: params.id },
      data
    })
    
    return NextResponse.json(Product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update Product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.Product.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete Product' },
      { status: 500 }
    )
  }
}