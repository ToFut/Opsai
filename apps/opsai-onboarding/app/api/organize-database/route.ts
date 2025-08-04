import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await request.json()
    
    console.log(`🗄️ Organizing database for tenant: ${tenantId}`)
    
    // Step 1: Fetch all sample data for the tenant
    console.log(`📊 Step 1: Fetching sample data for tenant ${tenantId}...`)
    let sampleDataRecords
    try {
      const { data, error } = await supabase
        .from('tenant_sample_data')
        .select('*')
        .eq('tenant_id', tenantId)
      
      if (!error && data?.length) {
        sampleDataRecords = data
      } else {
        throw new Error('Supabase tables not ready')
      }
    } catch (error) {
      console.log('⚠️  Using temp storage to fetch sample data')
      const { tempStorage } = await import('@/lib/temp-storage')
      sampleDataRecords = await tempStorage.getSampleDataForTenant(tenantId)
    }
    
    if (!sampleDataRecords?.length) {
      return NextResponse.json({ error: 'No sample data found' }, { status: 404 })
    }
    
    // Step 2: Analyze all data together to understand relationships
    console.log(`🧠 Step 2: Analyzing data for ${sampleDataRecords.length} providers...`)
    const combinedAnalysis = await analyzeMultiProviderData(sampleDataRecords)
    console.log(`✅ Step 2 complete: Analysis generated`)
    
    // Step 3: Generate optimal database schema
    console.log(`🗄️ Step 3: Generating database schema...`)
    const schema = await generateDatabaseSchema(combinedAnalysis, tenantId)
    console.log(`✅ Step 3 complete: Schema generated`)
    
    // Step 4: Store the schema
    let schemaRecord
    try {
      const { data, error } = await supabase
        .from('tenant_data_schemas')
        .insert({
          tenant_id: tenantId,
          providers: sampleDataRecords.map(r => r.provider),
          entities: schema.entities
        })
        .select()
        .single()
      
      if (!error) {
        schemaRecord = data
        console.log(`✅ Schema saved to Supabase for tenant ${tenantId}`)
      } else {
        throw error
      }
    } catch (error) {
      console.log('⚠️  Using temp storage to save schema')
      const { tempStorage } = await import('@/lib/temp-storage')
      schemaRecord = await tempStorage.saveSchema({
        tenant_id: tenantId,
        providers: sampleDataRecords.map(r => r.provider),
        entities: schema.entities,
        relationships: schema.relationships,
        indexes: schema.indexes,
        views: schema.views
      })
    }
    
    // Step 5: Organize existing sample data into the new schema
    await organizeSampleData(tenantId, sampleDataRecords, schema)
    
    // TRIGGER COMPLETE APP GENERATION AFTER DATABASE ORGANIZATION
    console.log(`🚀 Database organized! Now triggering complete app generation for ${tenantId}...`)
    
    // Trigger the complete flow asynchronously with timeout
    Promise.race([
      triggerCompleteAppGeneration(tenantId, schemaRecord, schema),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('App generation timeout')), 60000)
      )
    ]).catch(err => {
      console.error('App generation failed or timed out:', err)
    })

    return NextResponse.json({
      success: true,
      schemaId: schemaRecord.id,
      schema,
      message: 'Database organized successfully! App generation started...',
      nextStep: 'App generation in progress - you will receive your deployed app URL soon!'
    })
    
  } catch (error) {
    console.error('Database organization error:', error)
    return NextResponse.json(
      { error: 'Failed to organize database' },
      { status: 500 }
    )
  }
}

async function analyzeMultiProviderData(sampleDataRecords: any[]) {
  // Add timeout to prevent hanging
  return Promise.race([
    performAnalysis(sampleDataRecords),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Analysis timeout after 30 seconds')), 30000)
    )
  ])
}

async function performAnalysis(sampleDataRecords: any[]) {
  const allEntities: Record<string, any> = {}
  const allMetrics: Record<string, any> = {}
  const providers: string[] = []
  
  // Combine all sample data
  for (const record of sampleDataRecords) {
    providers.push(record.provider)
    
    if (record.sample_data?.entities) {
      for (const [entityName, entityData] of Object.entries(record.sample_data.entities)) {
        const fullEntityName = `${record.provider}_${entityName}`
        allEntities[fullEntityName] = entityData
      }
    }
    
    if (record.sample_data?.metrics) {
      allMetrics[record.provider] = record.sample_data.metrics
    }
  }
  
  // Use AI to analyze the combined data
  const analysisPrompt = `
    Analyze this multi-provider business data and identify:
    1. Common entities across providers (e.g., customer in Stripe = customer in Shopify)
    2. Cross-provider relationships (e.g., GitHub user -> Stripe customer)
    3. Key business metrics to track
    4. Suggested data model optimizations
    
    Providers: ${providers.join(', ')}
    Entities: ${JSON.stringify(Object.keys(allEntities))}
    Sample Data: ${JSON.stringify(allEntities, null, 2).slice(0, 3000)}
    
    Return a JSON object with:
    - commonEntities: array of entity mappings
    - crossProviderRelationships: array of relationships
    - keyMetrics: array of important metrics
    - optimizations: array of suggestions
  `
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a database architect specializing in multi-tenant SaaS applications.'
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3
  })
  
  const analysis = JSON.parse(completion.choices[0].message.content || '{}')
  
  return {
    providers,
    entities: allEntities,
    metrics: allMetrics,
    analysis
  }
}

async function generateDatabaseSchema(combinedAnalysis: any, tenantId: string) {
  const schemaPrompt = `
    Generate an optimal PostgreSQL database schema for this multi-provider data.
    
    Requirements:
    1. Unified entities where possible (e.g., unified_customers table)
    2. Provider-specific tables for unique data
    3. Junction tables for many-to-many relationships
    4. Proper foreign keys and constraints
    5. Optimized indexes for common queries
    6. Audit fields (created_at, updated_at, etc.)
    
    Analysis: ${JSON.stringify(combinedAnalysis.analysis)}
    Entities: ${JSON.stringify(Object.keys(combinedAnalysis.entities))}
    
    Return a JSON object with:
    - entities: object with table definitions
    - relationships: array of foreign key relationships
    - indexes: array of index definitions
    - views: array of useful view definitions
  `
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a PostgreSQL expert. Generate production-ready schemas.'
      },
      {
        role: 'user',
        content: schemaPrompt
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3
  })
  
  const schema = JSON.parse(completion.choices[0].message.content || '{}')
  
  // Add tenant isolation to all tables
  if (schema.entities) {
    for (const [tableName, tableDefinition] of Object.entries(schema.entities)) {
      if (tableDefinition && typeof tableDefinition === 'object' && (tableDefinition as any).fields) {
        (tableDefinition as any).fields.tenant_id = {
          type: 'VARCHAR(255)',
          required: true,
          index: true
        }
      }
    }
  }
  
  return schema
}

async function organizeSampleData(tenantId: string, sampleDataRecords: any[], schema: any) {
  console.log(`📦 Organizing sample data into structured tables for tenant: ${tenantId}`)
  
  // For each entity in the schema, insert the sample data
  for (const record of sampleDataRecords) {
    if (!record.sample_data?.entities) continue
    
    for (const [entityName, entityData] of Object.entries(record.sample_data.entities)) {
      const samples = Array.isArray((entityData as any).sample) 
        ? (entityData as any).sample 
        : [(entityData as any).sample]
      
      for (const sample of samples) {
        if (!sample) continue
        
        // Insert into tenant_dynamic_data table
        try {
          const { error } = await supabase
            .from('tenant_dynamic_data')
            .upsert({
              tenant_id: tenantId,
              entity_type: `${record.provider}_${entityName}`,
              entity_id: sample.id || sample.email || JSON.stringify(sample).slice(0, 50),
              data: sample,
              metadata: {
                provider: record.provider,
                original_entity: entityName,
                imported_at: new Date().toISOString()
              }
            })
          
          if (error) throw error
        } catch (error) {
          // Fallback to temp storage
          const { tempStorage } = await import('@/lib/temp-storage')
          await tempStorage.saveDynamicData({
            tenant_id: tenantId,
            entity_type: `${record.provider}_${entityName}`,
            entity_id: sample.id || sample.email || JSON.stringify(sample).slice(0, 50),
            data: sample,
            metadata: {
              provider: record.provider,
              original_entity: entityName,
              imported_at: new Date().toISOString()
            }
          })
        }
      }
    }
  }
  
  console.log(`✅ Sample data organized for tenant: ${tenantId}`)
}

async function triggerCompleteAppGeneration(tenantId: string, schemaRecord: any, schema: any) {
  try {
    console.log(`🎯 STARTING COMPLETE APP GENERATION FLOW FOR ${tenantId}`)
    
    // Step 1: Trigger AI Analysis
    console.log('📊 Step 1: Running AI Analysis...')
    const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai-analyze-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: tenantId })
    })
    
    if (!analysisResponse.ok) {
      throw new Error(`AI Analysis failed: ${analysisResponse.statusText}`)
    }
    
    const analysisResult = await analysisResponse.json()
    console.log('✅ AI Analysis completed')
    
    // Step 2: Generate complete app using existing API endpoint
    console.log('🏗️ Step 2: Generating complete business app...')
    
    const appGenerationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-complete-app`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        businessName: analysisResult.analysis?.business_type || 'Business App',
        schema: schema,
        sampleData: schemaRecord,
        analysis: analysisResult.analysis
      })
    })
    
    if (!appGenerationResponse.ok) {
      throw new Error(`App generation failed: ${appGenerationResponse.statusText}`)
    }
    
    const appResult = await appGenerationResponse.json()
    console.log('✅ App generated successfully:', appResult)
    
    // Step 3: Deploy to production (if deployment API exists)
    let deploymentResult = { appUrl: `http://localhost:3001` } // Default local URL
    
    try {
      console.log('🚀 Step 3: Deploying to production...')
      const deployResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deploy-production`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          appPath: appResult.appPath,
          appName: appResult.appName
        })
      })
      
      if (deployResponse.ok) {
        deploymentResult = await deployResponse.json()
        console.log('✅ Deployed to production:', deploymentResult.appUrl)
      } else {
        console.log('⚠️ Using local development URL')
      }
    } catch (error) {
      console.log('⚠️ Deployment skipped, app available locally')
    }
    
    // Step 4: Store final results
    await supabase
      .from('tenant_app_generation')
      .upsert({
        tenant_id: tenantId,
        app_url: deploymentResult.appUrl || `http://localhost:3001`,
        app_path: appResult.appPath,
        app_name: appResult.appName,
        status: 'deployed',
        schema_id: schemaRecord.id,
        features: {
          entities: Object.keys(schema).length,
          hasAuth: true,
          hasAPI: true,
          hasDashboard: true
        },
        deployment_result: { ...appResult, ...deploymentResult },
        created_at: new Date().toISOString()
      })
    
    console.log(`🎉 COMPLETE! App deployed at: ${deploymentResult.appUrl || 'http://localhost:3001'}`)
    
  } catch (error) {
    console.error('❌ Complete app generation failed:', error)
    
    // Store failure
    await supabase
      .from('tenant_app_generation')
      .upsert({
        tenant_id: tenantId,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        created_at: new Date().toISOString()
      })
  }
}