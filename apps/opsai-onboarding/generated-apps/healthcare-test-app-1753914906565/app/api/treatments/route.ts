import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const treatments = await prisma.treatment.findMany()
    return NextResponse.json(treatments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch Treatments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const treatment = await prisma.treatment.create({
      data
    })
    return NextResponse.json(treatment)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create Treatment' }, { status: 500 })
  }
}