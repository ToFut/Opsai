import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { sourceId } = await request.json()

    // First, discover the schema
    const schemaResponse = await fetch(`${process.env.AIRBYTE_API_URL}/sources/discover_schema`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        sourceId,
        disable_cache: true 
      })
    })

    if (!schemaResponse.ok) {
      throw new Error('Failed to discover schema')
    }

    const schemaData = await schemaResponse.json()
    const catalog = schemaData.catalog

    // Extract sample data information
    const streams = catalog.streams || []
    const sampleData = {
      sourceId,
      totalStreams: streams.length,
      streams: streams.map((stream: any) => ({
        name: stream.stream.name,
        namespace: stream.stream.namespace,
        jsonSchema: stream.stream.jsonSchema,
        supportedSyncModes: stream.stream.supportedSyncModes,
        sourceDefinedCursor: stream.stream.sourceDefinedCursor,
        defaultCursorField: stream.stream.defaultCursorField,
        sourceDefinedPrimaryKey: stream.stream.sourceDefinedPrimaryKey,
        fields: extractFields(stream.stream.jsonSchema)
      })),
      recordCount: estimateRecordCount(streams)
    }

    return NextResponse.json(sampleData)

  } catch (error) {
    console.error('Error sampling source data:', error)
    return NextResponse.json(
      { error: 'Failed to sample source data' },
      { status: 500 }
    )
  }
}

function extractFields(jsonSchema: any): any[] {
  const fields: any[] = []
  
  if (jsonSchema && jsonSchema.properties) {
    Object.entries(jsonSchema.properties).forEach(([fieldName, fieldSchema]: [string, any]) => {
      fields.push({
        name: fieldName,
        type: Array.isArray(fieldSchema.type) ? fieldSchema.type : [fieldSchema.type],
        format: fieldSchema.format,
        description: fieldSchema.description,
        airbyte_type: fieldSchema.airbyte_type,
        enum: fieldSchema.enum,
        required: jsonSchema.required?.includes(fieldName) || false
      })
    })
  }

  return fields
}

function estimateRecordCount(streams: any[]): number {
  // This is a placeholder - in real implementation, 
  // you might want to run a limited sync to get actual counts
  return streams.length * 1000 // Estimate 1000 records per stream
}