import { NextRequest, NextResponse } from 'next/server'
import { listAvailableModels, getModelMetadata } from '@/lib/supabase-storage'

/**
 * Get status of GPT-OSS models and infrastructure
 */
export async function GET(request: NextRequest) {
  try {
    // List available models in Supabase
    const models = await listAvailableModels()
    
    // Get metadata for each model
    const modelStatus = await Promise.all(
      Object.keys(models).map(async (modelName) => {
        const metadata = await getModelMetadata(modelName)
        return {
          name: modelName,
          files: models[modelName],
          status: metadata?.status || 'not_initialized',
          sizeGB: metadata?.size_gb || 0,
          lastUsed: metadata?.last_used || null
        }
      })
    )

    return NextResponse.json({
      success: true,
      models: modelStatus,
      storage: {
        provider: 'supabase',
        buckets: ['models', 'fine-tuned-models', 'training-data']
      },
      inference: {
        available: process.env.USE_LOCAL_MODELS === 'true',
        fallback: process.env.USE_OPENAI_FALLBACK === 'true'
      }
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get GPT-OSS status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}