import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  // Initialize clients inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
  })
  try {
    const { tenantId, userId } = await request.json()
    const finalTenantId = tenantId || userId || 'default'
    
    console.log(`🗄️ Organizing database for tenant: ${finalTenantId}`)
    
    // Step 1: Get connected integrations
    const { data: integrations, error: intError } = await supabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', finalTenantId)
      .eq('status', 'connected')
    
    if (intError) {
      throw new Error(`Failed to fetch integrations: ${intError.message}`)
    }
    
    if (!integrations?.length) {
      return NextResponse.json({ 
        error: 'No connected integrations found',
        tenantId: finalTenantId 
      }, { status: 404 })
    }
    
    // Step 2: Get sample data  
    const { data: sampleDataRecords, error: sampleError } = await supabase
      .from('tenant_sample_data')
      .select('*')
      .eq('tenant_id', finalTenantId)
    
    if (sampleError) {
      throw new Error(`Failed to fetch sample data: ${sampleError.message}`)
    }
    
    if (!sampleDataRecords?.length) {
      return NextResponse.json({ 
        error: 'No sample data found for connected integrations',
        integrations: integrations.map(i => i.provider)
      }, { status: 404 })
    }
    
    // Step 3: Create a simplified organized schema
    console.log(`🗄️ Step 3: Creating organized schema...`)
    const schema = await createSimplifiedSchema(sampleDataRecords, integrations)
    console.log(`✅ Step 3 complete: Schema created`)
    
    // Step 4: Store the organized schema
    const { data: schemaRecord, error: schemaError } = await supabase
      .from('tenant_data_schemas')
      .upsert({
        tenant_id: finalTenantId,
        providers: integrations.map(i => i.provider),
        entities: schema.entities,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (schemaError) {
      throw new Error(`Failed to save schema: ${schemaError.message}`)
    }
    
    console.log(`✅ Database organized successfully for tenant ${finalTenantId}`)

    return NextResponse.json({
      success: true,
      schemaId: schemaRecord.id,
      tenantId: finalTenantId,
      providers: integrations.map(i => i.provider),
      entities: Object.keys(schema.entities),
      sampleDataRecords: sampleDataRecords.length,
      message: `Database organized successfully for ${integrations.length} integrations with ${sampleDataRecords.length} data records`
    })
    
  } catch (error) {
    console.error('Database organization error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to organize database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function createSimplifiedSchema(sampleDataRecords: any[], integrations: any[]) {
  const entities: Record<string, any> = {}
  
  // Create entities from sample data
  sampleDataRecords.forEach(sample => {
    const provider = sample.provider
    const sampleEntities = sample.sample_data?.entities || {}
    
    Object.keys(sampleEntities).forEach(entityType => {
      const entityName = `${provider}_${entityType}`
      const sampleData = sampleEntities[entityType]
      
      // Extract field structure from sample data
      let fields: string[] = []
      if (Array.isArray(sampleData)) {
        fields = Object.keys(sampleData[0] || {})
      } else if (sampleData && typeof sampleData === 'object') {
        fields = Object.keys(sampleData)
      }
      
      entities[entityName] = {
        description: `${entityType} data from ${provider}`,
        fields: fields,
        source: provider,
        primaryKey: 'id',
        recordCount: Array.isArray(sampleData) ? sampleData.length : 1
      }
    })
  })
  
  return { entities }
}

