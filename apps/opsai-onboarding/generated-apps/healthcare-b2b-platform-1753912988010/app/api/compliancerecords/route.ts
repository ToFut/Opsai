import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const compliancerecords = await prisma.compliancerecord.findMany()
    return NextResponse.json(compliancerecords)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ComplianceRecords' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const compliancerecord = await prisma.compliancerecord.create({
      data
    })
    return NextResponse.json(compliancerecord)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ComplianceRecord' }, { status: 500 })
  }
}