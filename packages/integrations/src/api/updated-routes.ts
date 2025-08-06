/**
 * Updated API routes using GPT-OSS models
 * Drop-in replacements for existing OpenAI-based routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { aiAdapter } from '../services/ai-adapter'

// ============================================
// 1. Website Analysis Route
// Original: /api/ai-analyze
// ============================================
export async function analyzeWebsite(request: NextRequest) {
  try {
    const { websiteUrl } = await request.json()

    const analysis = await aiAdapter.process({
      type: 'analyze',
      input: `Analyze this business website and provide comprehensive insights: ${websiteUrl}`,
      context: { websiteUrl },
      constraints: {
        maxTokens: 3000,
        temperature: 0.3,
        responseFormat: 'json'
      }
    })

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        model: 'gpt-oss',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Website analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze website' },
      { status: 500 }
    )
  }
}

// ============================================
// 2. YAML Generation Route
// Original: /api/ai-generate-yaml
// ============================================
export async function generateYAML(request: NextRequest) {
  try {
    const { businessAnalysis, confirmedInsights, businessProfile } = await request.json()

    const yamlConfig = await aiAdapter.process({
      type: 'generate',
      input: `Generate a complete YAML configuration for an OpsAI application based on this business analysis`,
      context: {
        businessAnalysis,
        confirmedInsights,
        businessProfile
      },
      constraints: {
        maxTokens: 4000,
        temperature: 0.2,
        responseFormat: 'yaml'
      }
    })

    return NextResponse.json({
      success: true,
      yaml: yamlConfig,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'gpt-oss'
      }
    })

  } catch (error) {
    console.error('YAML generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate YAML' },
      { status: 500 }
    )
  }
}

// ============================================
// 3. Workflow Analysis Route
// Original: /api/ai-analyze-workflow
// ============================================
export async function analyzeWorkflow(request: NextRequest) {
  try {
    const { workflowDescription, businessContext } = await request.json()

    const workflowAnalysis = await aiAdapter.process({
      type: 'analyze',
      input: `Analyze and optimize this business workflow: ${workflowDescription}`,
      context: businessContext,
      constraints: {
        maxTokens: 2000,
        temperature: 0.4,
        responseFormat: 'json'
      }
    })

    return NextResponse.json({
      success: true,
      workflow: workflowAnalysis,
      recommendations: workflowAnalysis.recommendations || []
    })

  } catch (error) {
    console.error('Workflow analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze workflow' },
      { status: 500 }
    )
  }
}

// ============================================
// 4. Code Generation Route
// Original: /api/generate-complete-app
// ============================================
export async function generateApplication(request: NextRequest) {
  try {
    const { yamlConfig, appName, features } = await request.json()

    // Generate multiple components in parallel
    const [appStructure, apiRoutes, uiComponents] = await Promise.all([
      aiAdapter.process({
        type: 'generate',
        input: 'Generate Next.js app structure and configuration',
        context: { yamlConfig, appName },
        constraints: { maxTokens: 4000, temperature: 0.3 }
      }),
      aiAdapter.process({
        type: 'generate',
        input: 'Generate API routes and backend logic',
        context: { yamlConfig, features },
        constraints: { maxTokens: 6000, temperature: 0.3 }
      }),
      aiAdapter.process({
        type: 'generate',
        input: 'Generate React components and UI',
        context: { yamlConfig, features },
        constraints: { maxTokens: 6000, temperature: 0.4 }
      })
    ])

    return NextResponse.json({
      success: true,
      application: {
        structure: appStructure,
        api: apiRoutes,
        ui: uiComponents
      },
      metadata: {
        appName,
        generatedAt: new Date().toISOString(),
        model: 'gpt-oss'
      }
    })

  } catch (error) {
    console.error('App generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate application' },
      { status: 500 }
    )
  }
}

// ============================================
// 5. Code Improvement Route
// Original: /api/ai-improve
// ============================================
export async function improveCode(request: NextRequest) {
  try {
    const { code, improvementType, context } = await request.json()

    const improvements = await aiAdapter.process({
      type: 'improve',
      input: `Improve this code for ${improvementType}: \n\n${code}`,
      context,
      constraints: {
        maxTokens: 3000,
        temperature: 0.5,
        responseFormat: 'json'
      }
    })

    return NextResponse.json({
      success: true,
      improvements,
      metadata: {
        improvementType,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Code improvement error:', error)
    return NextResponse.json(
      { error: 'Failed to improve code' },
      { status: 500 }
    )
  }
}

// ============================================
// Utility: Batch Processing Route
// ============================================
export async function batchAIProcess(request: NextRequest) {
  try {
    const { tasks } = await request.json()

    const results = await aiAdapter.batchProcess(tasks)

    return NextResponse.json({
      success: true,
      results,
      metadata: {
        totalTasks: tasks.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    console.error('Batch processing error:', error)
    return NextResponse.json(
      { error: 'Batch processing failed' },
      { status: 500 }
    )
  }
}

// ============================================
// Model Management Routes
// ============================================
export async function getModelStatus(request: NextRequest) {
  const { gptOSSManager } = await import('../services/gpt-oss-manager')
  const status = gptOSSManager.getStatus()
  const metrics = aiAdapter.getMetrics()

  return NextResponse.json({
    status,
    metrics,
    timestamp: new Date().toISOString()
  })
}

export async function downloadModel(request: NextRequest) {
  try {
    const { modelSize } = await request.json()
    const { gptOSSManager } = await import('../services/gpt-oss-manager')
    
    const model = await gptOSSManager.downloadAndStoreModel(modelSize)

    return NextResponse.json({
      success: true,
      model,
      message: `Model ${modelSize} downloaded and stored in Supabase`
    })

  } catch (error) {
    console.error('Model download error:', error)
    return NextResponse.json(
      { error: 'Failed to download model' },
      { status: 500 }
    )
  }
}

export async function startInference(request: NextRequest) {
  try {
    const { modelSize } = await request.json()
    const { gptOSSManager } = await import('../services/gpt-oss-manager')
    
    await gptOSSManager.startInferenceServer(modelSize)

    return NextResponse.json({
      success: true,
      message: `Inference server started for ${modelSize}`
    })

  } catch (error) {
    console.error('Inference start error:', error)
    return NextResponse.json(
      { error: 'Failed to start inference server' },
      { status: 500 }
    )
  }
}