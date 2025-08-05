import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Initialize Supabase client inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { sourceId } = await request.json()

    // Check if Airbyte is configured
    if (!process.env.AIRBYTE_API_URL || !process.env.AIRBYTE_API_KEY) {
      return NextResponse.json(
        { 
          status: 'failed',
          message: 'Airbyte API not configured. Please set AIRBYTE_API_KEY and AIRBYTE_API_URL environment variables.' 
        },
        { status: 503 }
      )
    }

    // Test the source connection
    const response = await fetch(`${process.env.AIRBYTE_API_URL}/sources/check_connection`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sourceId })
    })

    if (!response.ok) {
      throw new Error('Failed to test connection')
    }

    const result = await response.json()

    // Update source status in database
    await supabase
      .from('tenant_sources')
      .update({
        status: result.status === 'succeeded' ? 'active' : 'failed',
        last_test_at: new Date().toISOString(),
        last_test_status: result.status === 'succeeded' ? 'success' : 'failed'
      })
      .eq('airbyte_source_id', sourceId)

    return NextResponse.json({
      status: result.status,
      message: result.message,
      jobInfo: result.jobInfo
    })

  } catch (error) {
    console.error('Error testing source:', error)
    return NextResponse.json(
      { 
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to test source connection' 
      },
      { status: 500 }
    )
  }
}