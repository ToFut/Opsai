import { NextRequest, NextResponse } from 'next/server'
import { initializeModelStorage } from '@/lib/supabase-storage'

/**
 * Initialize GPT-OSS storage buckets in Supabase
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Initializing GPT-OSS storage in Supabase...')
    
    const success = await initializeModelStorage()
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to initialize storage buckets' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'GPT-OSS storage initialized successfully',
      buckets: ['models', 'fine-tuned-models', 'training-data']
    })

  } catch (error) {
    console.error('Initialization error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initialize GPT-OSS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}