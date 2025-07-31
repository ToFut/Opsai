import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const patients = await prisma.patient.findMany()
    return NextResponse.json(patients)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch Patients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const patient = await prisma.patient.create({
      data
    })
    return NextResponse.json(patient)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create Patient' }, { status: 500 })
  }
}