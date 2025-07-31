import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const Products = await prisma.Product.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(Products)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const Product = await prisma.Product.create({
      data
    })
    
    return NextResponse.json(Product, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create Product' },
      { status: 500 }
    )
  }
}