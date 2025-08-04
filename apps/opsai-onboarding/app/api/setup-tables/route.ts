import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up Supabase tables for OAuth flow...')
    
    // First, let's try to create tables one by one using individual queries
    const tables = [
      {
        name: 'tenant_integrations',
        query: `
          INSERT INTO "public"."tenant_integrations" ("tenant_id", "provider", "status") 
          VALUES ('test', 'test', 'test') 
          ON CONFLICT DO NOTHING;
          DELETE FROM "public"."tenant_integrations" WHERE tenant_id = 'test';
        `
      }
    ]
    
    // Test if we can at least insert data (which will create the table structure)
    let createdCount = 0
    const results = []
    
    // Try to create a simple test record to check if tables exist
    try {
      console.log('Testing tenant_integrations table...')
      const { data, error } = await supabase
        .from('tenant_integrations')
        .insert({
          tenant_id: 'test_setup',
          provider: 'test',
          status: 'testing'
        })
        .select()
      
      if (!error) {
        console.log('✅ tenant_integrations table exists')
        // Clean up test record
        await supabase
          .from('tenant_integrations')
          .delete()
          .eq('tenant_id', 'test_setup')
        createdCount++
      } else {
        console.log('❌ tenant_integrations:', error.message)
      }
    } catch (err) {
      console.log('❌ tenant_integrations test failed:', (err as Error).message)
    }
    
    try {
      console.log('Testing tenant_sample_data table...')
      const { data, error } = await supabase
        .from('tenant_sample_data')
        .insert({
          tenant_id: 'test_setup',
          provider: 'test',
          sample_data: { test: true },
          collected_at: new Date().toISOString()
        })
        .select()
      
      if (!error) {
        console.log('✅ tenant_sample_data table exists')
        await supabase
          .from('tenant_sample_data')
          .delete()
          .eq('tenant_id', 'test_setup')
        createdCount++
      } else {
        console.log('❌ tenant_sample_data:', error.message)
      }
    } catch (err) {
      console.log('❌ tenant_sample_data test failed:', (err as Error).message)
    }
    
    try {
      console.log('Testing tenant_data_schemas table...')
      const { data, error } = await supabase
        .from('tenant_data_schemas')
        .insert({
          tenant_id: 'test_setup',
          providers: ['test'],
          entities: { test: true },
          created_at: new Date().toISOString()
        })
        .select()
      
      if (!error) {
        console.log('✅ tenant_data_schemas table exists')
        await supabase
          .from('tenant_data_schemas')
          .delete()
          .eq('tenant_id', 'test_setup')
        createdCount++
      } else {
        console.log('❌ tenant_data_schemas:', error.message)
      }
    } catch (err) {
      console.log('❌ tenant_data_schemas test failed:', (err as Error).message)
    }
    
    try {
      console.log('Testing tenant_dynamic_data table...')
      const { data, error } = await supabase
        .from('tenant_dynamic_data')
        .insert({
          tenant_id: 'test_setup',
          entity_type: 'test',
          entity_id: 'test',
          data: { test: true },
          created_at: new Date().toISOString()
        })
        .select()
      
      if (!error) {
        console.log('✅ tenant_dynamic_data table exists')
        await supabase
          .from('tenant_dynamic_data')
          .delete()
          .eq('tenant_id', 'test_setup')
        createdCount++
      } else {
        console.log('❌ tenant_dynamic_data:', error.message)
      }
    } catch (err) {
      console.log('❌ tenant_dynamic_data test failed:', (err as Error).message)
    }
    
    console.log(`📋 Tables working: ${createdCount}/4`)
    
    if (createdCount === 4) {
      return NextResponse.json({
        success: true,
        message: 'All tables are working! OAuth flow will use Supabase.',
        tablesWorking: createdCount
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Tables need to be created manually in Supabase dashboard',
        tablesWorking: createdCount,
        instructions: [
          '1. Go to: https://supabase.com/dashboard/project/dqmufpexuuvlulpilirt/editor',
          '2. Click "SQL Editor" → "New Query"',
          '3. Copy the SQL from setup-oauth-tables.sql and run it',
          '4. Then the OAuth flow will automatically use Supabase!'
        ]
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Setup tables error:', error)
    return NextResponse.json(
      { error: 'Failed to setup tables' },
      { status: 500 }
    )
  }
}