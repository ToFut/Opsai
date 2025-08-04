import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { agents, tasks, process_type = 'sequential' } = body

    // Execute crew of agents
    const response = await fetch(`${AGENT_SERVICE_URL}/crew/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agents,
        tasks,
        process_type,
        user_id: session.user?.email
      })
    })

    if (!response.ok) {
      throw new Error(`Crew execution error: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Crew execution error:', error)
    return NextResponse.json(
      { error: 'Failed to execute crew tasks' },
      { status: 500 }
    )
  }
}