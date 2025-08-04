import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await request.json()
    
    console.log(`🗄️ Organizing database for tenant: ${tenantId} (Simple version)`)
    
    // Step 1: Fetch sample data from temp storage
    let sampleDataRecords
    try {
      const { tempStorage } = await import('@/lib/temp-storage')
      sampleDataRecords = await tempStorage.getSampleDataForTenant(tenantId)
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch sample data' }, { status: 404 })
    }
    
    if (!sampleDataRecords?.length) {
      return NextResponse.json({ error: 'No sample data found' }, { status: 404 })
    }
    
    console.log(`📊 Found ${sampleDataRecords.length} sample data records`)
    
    // Step 2: Generate a simple schema (without OpenAI)
    const schema = generateSimpleSchema(sampleDataRecords, tenantId)
    
    // Step 3: Save the schema
    try {
      const { tempStorage } = await import('@/lib/temp-storage')
      const schemaRecord = await tempStorage.saveSchema({
        tenant_id: tenantId,
        providers: sampleDataRecords.map(r => r.provider),
        entities: schema.entities,
        relationships: schema.relationships,
        indexes: schema.indexes,
        views: schema.views
      })
      
      // Step 4: Organize sample data
      await organizeSampleDataSimple(tenantId, sampleDataRecords, schema)
      
      return NextResponse.json({
        success: true,
        schemaId: schemaRecord.id,
        schema,
        message: 'Database organized successfully with simple schema'
      })
      
    } catch (error) {
      console.error('Failed to save schema:', error)
      throw error
    }
    
  } catch (error) {
    console.error('Database organization error:', error)
    return NextResponse.json(
      { error: 'Failed to organize database' },
      { status: 500 }
    )
  }
}

function generateSimpleSchema(sampleDataRecords: any[], tenantId: string) {
  const entities: any = {}
  const relationships: any[] = []
  
  // Create a unified customers table
  entities.unified_customers = {
    fields: {
      id: { type: 'UUID', primary: true },
      tenant_id: { type: 'VARCHAR(255)', required: true, index: true },
      email: { type: 'VARCHAR(255)', unique: true },
      name: { type: 'VARCHAR(255)' },
      created_at: { type: 'TIMESTAMPTZ', default: 'NOW()' },
      updated_at: { type: 'TIMESTAMPTZ', default: 'NOW()' }
    }
  }
  
  // Add provider-specific tables based on actual data
  sampleDataRecords.forEach(record => {
    const provider = record.provider
    
    if (record.sample_data?.entities) {
      Object.entries(record.sample_data.entities).forEach(([entityName, entityData]: [string, any]) => {
        const tableName = `${provider}_${entityName}`
        
        entities[tableName] = {
          fields: {
            id: { type: 'UUID', primary: true },
            tenant_id: { type: 'VARCHAR(255)', required: true, index: true },
            external_id: { type: 'VARCHAR(255)', index: true },
            data: { type: 'JSONB' },
            created_at: { type: 'TIMESTAMPTZ', default: 'NOW()' },
            updated_at: { type: 'TIMESTAMPTZ', default: 'NOW()' }
          }
        }
        
        // Add schema-based fields if available
        if (entityData.schema) {
          Object.entries(entityData.schema).forEach(([field, type]) => {
            entities[tableName].fields[field] = { 
              type: mapTypeToPostgres(type as string),
              nullable: true 
            }
          })
        }
      })
    }
  })
  
  // Add activity timeline
  entities.activity_timeline = {
    fields: {
      id: { type: 'UUID', primary: true },
      tenant_id: { type: 'VARCHAR(255)', required: true, index: true },
      source: { type: 'VARCHAR(50)' },
      event_type: { type: 'VARCHAR(100)' },
      event_data: { type: 'JSONB' },
      occurred_at: { type: 'TIMESTAMPTZ', default: 'NOW()' }
    }
  }
  
  return {
    entities,
    relationships,
    indexes: [
      { table: 'unified_customers', columns: ['tenant_id', 'email'] },
      { table: 'activity_timeline', columns: ['tenant_id', 'occurred_at'] }
    ],
    views: [
      {
        name: 'tenant_summary',
        sql: `SELECT tenant_id, COUNT(*) as total_customers FROM unified_customers GROUP BY tenant_id`
      }
    ]
  }
}

function mapTypeToPostgres(type: string): string {
  const mapping: Record<string, string> = {
    'string': 'VARCHAR(255)',
    'number': 'INTEGER',
    'boolean': 'BOOLEAN',
    'datetime': 'TIMESTAMPTZ',
    'timestamp': 'TIMESTAMPTZ',
    'array': 'JSONB',
    'object': 'JSONB'
  }
  
  return mapping[type] || 'TEXT'
}

async function organizeSampleDataSimple(tenantId: string, sampleDataRecords: any[], schema: any) {
  console.log(`📦 Organizing sample data into structured format for tenant: ${tenantId}`)
  
  const { tempStorage } = await import('@/lib/temp-storage')
  
  // Save each sample record as dynamic data
  for (const record of sampleDataRecords) {
    if (!record.sample_data?.entities) continue
    
    for (const [entityName, entityData] of Object.entries(record.sample_data.entities)) {
      const samples = Array.isArray((entityData as any).sample) 
        ? (entityData as any).sample 
        : [(entityData as any).sample]
      
      for (const sample of samples) {
        if (!sample) continue
        
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
  
  console.log(`✅ Sample data organized for tenant: ${tenantId}`)
}