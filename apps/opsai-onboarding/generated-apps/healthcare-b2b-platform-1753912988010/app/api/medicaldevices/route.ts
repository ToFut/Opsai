import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const medicaldevices = await prisma.medicaldevice.findMany()
    return NextResponse.json(medicaldevices)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch MedicalDevices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const medicaldevice = await prisma.medicaldevice.create({
      data
    })
    return NextResponse.json(medicaldevice)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create MedicalDevice' }, { status: 500 })
  }
}