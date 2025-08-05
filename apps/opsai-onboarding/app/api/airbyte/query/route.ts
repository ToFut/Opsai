import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Initialize Supabase client inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { table, source, limit = 100, offset = 0 } = await request.json()

    if (!table || !source) {
      return NextResponse.json(
        { error: 'Table and source parameters are required' },
        { status: 400 }
      )
    }

    // Query the Supabase destination for synced Airbyte data
    // Airbyte typically creates tables with prefixes like "_airbyte_raw_" and normalized tables
    const normalizedTableName = `${source}_${table}`
    
    console.log(`🔍 Querying Airbyte synced data: ${normalizedTableName}`)
    
    try {
      // First try the normalized table
      const { data, error, count } = await supabase
        .from(normalizedTableName)
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)

      if (error) {
        // If normalized table doesn't exist, try raw table format
        const rawTableName = `_airbyte_raw_${normalizedTableName}`
        console.log(`📊 Trying raw table: ${rawTableName}`)
        
        const { data: rawData, error: rawError } = await supabase
          .from(rawTableName)
          .select('_airbyte_data', { count: 'exact' })
          .range(offset, offset + limit - 1)

        if (rawError) {
          console.error('Supabase query error:', rawError)
          return NextResponse.json(
            { error: `Table ${normalizedTableName} not found. Data may not be synced yet.`, details: rawError.message },
            { status: 404 }
          )
        }

        // Parse JSON data from raw table
        const parsedData = rawData?.map(row => {
          try {
            return JSON.parse(row._airbyte_data as string)
          } catch {
            return row._airbyte_data
          }
        }) || []

        return NextResponse.json({
          records: parsedData,
          total: parsedData.length,
          source,
          table: normalizedTableName,
          type: 'raw'
        })
      }

      return NextResponse.json({
        records: data || [],
        total: count || 0,
        source,
        table: normalizedTableName,
        type: 'normalized'
      })

    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to query Airbyte data', details: error },
      { status: 500 }
    )
  }
}

// GET endpoint to list available tables
export async function GET() {
  try {
    // Get all tables from Supabase that match Airbyte patterns
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .or('table_name.like.*_airbyte_raw_%,table_name.like.stripe_%,table_name.like.shopify_%,table_name.like.google_%')

    if (error) {
      console.error('Failed to fetch tables:', error)
      return NextResponse.json(
        { error: 'Failed to fetch available tables' },
        { status: 500 }
      )
    }

    const availableTables = tables?.map(t => t.table_name) || []
    
    return NextResponse.json({
      available_tables: availableTables,
      sources: {
        stripe: availableTables.filter(t => t.startsWith('stripe_')),
        shopify: availableTables.filter(t => t.startsWith('shopify_')),
        google_analytics: availableTables.filter(t => t.startsWith('google_')),
        raw_tables: availableTables.filter(t => t.includes('_airbyte_raw_'))
      }
    })

  } catch (error) {
    console.error('GET API error:', error)
    return NextResponse.json(
      { error: 'Failed to list tables', details: error },
      { status: 500 }
    )
  }
}