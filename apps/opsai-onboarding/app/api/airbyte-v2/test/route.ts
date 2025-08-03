import { NextRequest, NextResponse } from 'next/server'
import { airbyteAPI } from '@/lib/airbyte-api-v2'

export async function POST(request: NextRequest) {
  try {
    const { testType = 'postgres' } = await request.json()
    
    console.log(`🧪 Testing Airbyte API v2 with ${testType}`)

    // Test 1: Create a simple PostgreSQL source
    if (testType === 'postgres') {
      const result = await airbyteAPI.createDirectSource(
        'postgres',
        `test-postgres-${Date.now()}`,
        {
          host: 'test-host.example.com',
          port: 5432,
          database: 'test_db',
          username: 'test_user',
          password: 'test_password',
          schemas: ['public']
        }
      )

      return NextResponse.json({
        success: true,
        message: 'PostgreSQL source created successfully',
        source: result
      })
    }

    // Test 2: Initiate OAuth for GitHub
    if (testType === 'github-oauth') {
      const result = await airbyteAPI.createOAuthSource(
        'github',
        `test-github-${Date.now()}`,
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7250'}/oauth-callback`
      )

      return NextResponse.json({
        success: true,
        message: 'OAuth initiated for GitHub',
        ...result
      })
    }

    // Test 3: List existing sources
    if (testType === 'list') {
      const result = await airbyteAPI.listSources()
      
      return NextResponse.json({
        success: true,
        sources: result.sources,
        count: result.sources.length
      })
    }

    return NextResponse.json(
      { error: 'Invalid test type' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}