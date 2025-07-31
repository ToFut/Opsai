import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const testmodels = await prisma.testmodel.findMany()
    return NextResponse.json(testmodels)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch TestModels' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const testmodel = await prisma.testmodel.create({
      data
    })
    return NextResponse.json(testmodel)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create TestModel' }, { status: 500 })
  }
}