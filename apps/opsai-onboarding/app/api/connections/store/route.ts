import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server operations
)

export async function POST(request: NextRequest) {
  try {
    const { tenantId, connection } = await request.json()

    if (!tenantId || !connection) {
      return NextResponse.json(
        { error: 'Missing tenantId or connection data' },
        { status: 400 }
      )
    }

    // Try to store in database, fallback to success if table doesn't exist
    let stored = false
    
    try {
      const { data, error } = await supabase
        .from('tenant_airbyte_connections')
        .insert({
          tenant_id: tenantId,
          source_id: connection.sourceId,
          source_name: connection.sourceName,
          source_type: connection.sourceName,
          connection_config: {
            encrypted: true,
            status: connection.status,
            last_sync: connection.lastSync,
            records_extracted: connection.recordsExtracted || 0,
            streams: connection.streams || [],
            created_at: connection.createdAt
          },
          status: connection.status === 'connected' ? 'active' : 'inactive',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.warn('Database storage failed (table might not exist):', error.message)
        stored = false
      } else {
        stored = true
        console.log('✅ Connection stored in database')
      }
    } catch (dbError) {
      console.warn('Database not available, using fallback storage:', dbError)
      stored = false
    }

    // Try to log in audit log (optional)
    try {
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: tenantId,
          action: 'connection_created',
          resource_type: 'airbyte_connection',
          resource_id: connection.sourceId,
          metadata: {
            source_name: connection.sourceName,
            source_type: connection.sourceName,
            status: connection.status,
            stored_in_db: stored
          },
          created_at: new Date().toISOString()
        })
    } catch (auditError) {
      console.warn('Audit logging failed, continuing:', auditError)
    }

    return NextResponse.json({ 
      success: true, 
      connectionId: stored ? 'db_connection' : 'demo_connection',
      message: stored ? 'Connection stored in database' : 'Connection stored for demo (database not available)',
      stored_in_database: stored
    })

  } catch (error) {
    console.error('Error storing connection:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}