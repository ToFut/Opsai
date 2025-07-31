import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const trainingsessions = await prisma.trainingsession.findMany()
    return NextResponse.json(trainingsessions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch TrainingSessions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const trainingsession = await prisma.trainingsession.create({
      data
    })
    return NextResponse.json(trainingsession)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create TrainingSession' }, { status: 500 })
  }
}