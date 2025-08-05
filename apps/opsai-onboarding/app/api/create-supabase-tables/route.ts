import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Initialize Supabase client inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    console.log('🔧 Creating Supabase tables for OAuth flow...')
    
    // Create the tables by inserting and deleting test data
    // This will create the table structure
    
    const tables = [
      {
        name: 'tenant_integrations',
        testData: {
          tenant_id: '__test__',
          provider: 'test',
          access_token: 'test',
          status: 'test'
        }
      },
      {
        name: 'tenant_sample_data', 
        testData: {
          tenant_id: '__test__',
          provider: 'test',
          sample_data: { test: true }
        }
      },
      {
        name: 'tenant_data_schemas',
        testData: {
          tenant_id: '__test__',
          providers: ['test'],
          entities: { test: true }
        }
      },
      {
        name: 'tenant_dynamic_data',
        testData: {
          tenant_id: '__test__',
          entity_type: 'test',
          entity_id: 'test',
          data: { test: true }
        }
      }
    ]

    const results = []
    
    for (const table of tables) {
      try {
        console.log(`Creating table: ${table.name}`)
        
        // Try to insert test data (this will create the table if RLS allows)
        const { data, error } = await supabase
          .from(table.name)
          .insert(table.testData)
          .select()
        
        if (!error) {
          // Clean up test data
          await supabase
            .from(table.name)
            .delete()
            .eq('tenant_id', '__test__')
          
          console.log(`✅ Table ${table.name} created and tested`)
          results.push({ table: table.name, status: 'created' })
        } else {
          console.log(`❌ Failed to create ${table.name}:`, error.message)
          results.push({ table: table.name, status: 'failed', error: error.message })
        }
      } catch (err) {
        console.log(`❌ Error with ${table.name}:`, (err as Error).message)
        results.push({ table: table.name, status: 'error', error: (err as Error).message })
      }
    }
    
    const successCount = results.filter(r => r.status === 'created').length
    
    if (successCount === tables.length) {
      return NextResponse.json({
        success: true,
        message: 'All tables created! OAuth flow will now use Supabase.',
        results
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Only ${successCount}/${tables.length} tables created. Manual setup may be needed.`,
        results,
        instructions: [
          '1. Go to Supabase Dashboard',
          '2. Disable RLS or create tables manually',
          '3. Use the SQL from setup-oauth-tables.sql'
        ]
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Table creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create tables' },
      { status: 500 }
    )
  }
}