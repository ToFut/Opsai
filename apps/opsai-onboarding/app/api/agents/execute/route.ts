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
    const { agent_name, task_type, parameters } = body

    // Call Python agent service
    const response = await fetch(`${AGENT_SERVICE_URL}/agents/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_name,
        task_type,
        parameters,
        user_id: session.user?.email
      })
    })

    if (!response.ok) {
      throw new Error(`Agent service error: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Agent execution error:', error)
    return NextResponse.json(
      { error: 'Failed to execute agent task' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get available agents
    const response = await fetch(`${AGENT_SERVICE_URL}/agents`)
    const agents = await response.json()

    return NextResponse.json({ agents })

  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}