import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { tenantId, schemaId } = await request.json()
    
    console.log(`🎯 ORCHESTRATING COMPLETE APP GENERATION FOR TENANT: ${tenantId}`)
    
    // Step 1: AI Workflow Analysis
    console.log('📊 Step 1: Running AI Workflow Analysis...')
    const analysisResult = await triggerAIAnalysis(tenantId)
    
    // Step 2: Generate Complete Business App
    console.log('🏗️ Step 2: Generating Complete Business Application...')
    const appGenResult = await generateBusinessApp(tenantId, analysisResult)
    
    // Step 3: Deploy to Production
    console.log('🚀 Step 3: Deploying to Production...')
    const deploymentResult = await deployToProduction(tenantId, appGenResult)
    
    // Step 4: Store Results
    await storeOrchestrationResults(tenantId, {
      analysis: analysisResult,
      appGeneration: appGenResult,
      deployment: deploymentResult,
      completedAt: new Date().toISOString()
    })
    
    console.log(`✅ COMPLETE! App generated and deployed for ${tenantId}`)
    
    return NextResponse.json({
      success: true,
      tenantId,
      appUrl: deploymentResult.appUrl,
      dashboardUrl: deploymentResult.dashboardUrl,
      message: 'Complete SaaS application generated and deployed successfully!',
      results: {
        analysis: analysisResult,
        appGeneration: appGenResult,
        deployment: deploymentResult
      }
    })
    
  } catch (error) {
    console.error('❌ Orchestration failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'App generation failed',
        stage: 'orchestration'
      },
      { status: 500 }
    )
  }
}

async function triggerAIAnalysis(tenantId: string) {
  console.log(`🧠 Analyzing business data for ${tenantId}...`)
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai-analyze-workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: tenantId })
  })
  
  if (!response.ok) {
    throw new Error(`AI Analysis failed: ${response.statusText}`)
  }
  
  const result = await response.json()
  console.log('✅ AI Analysis completed')
  return result.analysis
}

async function generateBusinessApp(tenantId: string, analysis: any) {
  console.log(`🏗️ Generating business app for ${tenantId}...`)
  
  // Get organized data from database
  const { data: schemaData } = await supabase
    .from('tenant_data_schemas')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
    
  const { data: sampleData } = await supabase
    .from('tenant_sample_data')
    .select('*')
    .eq('tenant_id', tenantId)
  
  // Generate the app using the intelligent generator
  const appConfig = {
    tenantId,
    businessName: analysis.business_type || 'Business App',
    schema: schemaData?.entities || {},
    sampleData: sampleData || [],
    analysis: analysis,
    workflows: analysis.recommendations || []
  }
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-complete-app`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appConfig)
  })
  
  if (!response.ok) {
    throw new Error(`App Generation failed: ${response.statusText}`)
  }
  
  const result = await response.json()
  console.log('✅ Business app generated')
  return result
}

async function deployToProduction(tenantId: string, appGenResult: any) {
  console.log(`🚀 Deploying ${tenantId} to production...`)
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deploy-to-vercel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId,
      appPath: appGenResult.appPath,
      appName: appGenResult.appName || `${tenantId}-app`
    })
  })
  
  if (!response.ok) {
    throw new Error(`Deployment failed: ${response.statusText}`)
  }
  
  const result = await response.json()
  console.log('✅ App deployed to production')
  return result
}

async function storeOrchestrationResults(tenantId: string, results: any) {
  try {
    await supabase
      .from('tenant_app_generation')
      .upsert({
        tenant_id: tenantId,
        generation_results: results,
        status: 'completed',
        app_url: results.deployment?.appUrl,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.warn('Failed to store orchestration results:', error)
  }
}