import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Initialize Supabase client inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { tenantId = 'default' } = await request.json()
    
    console.log(`🔄 Migrating temp data to Supabase for tenant: ${tenantId}`)
    
    // Import temp storage
    const { tempStorage } = await import('@/lib/temp-storage')
    
    // Get all temp data
    const sampleDataRecords = await tempStorage.getSampleDataForTenant(tenantId)
    
    if (!sampleDataRecords?.length) {
      return NextResponse.json({ 
        success: false, 
        message: 'No temp data found to migrate' 
      }, { status: 404 })
    }
    
    console.log(`📊 Found ${sampleDataRecords.length} sample data records to migrate`)
    
    let migratedCount = 0
    const results = []
    
    // Migrate sample data to Supabase
    for (const record of sampleDataRecords) {
      try {
        const { data, error } = await supabase
          .from('tenant_sample_data')
          .upsert({
            tenant_id: record.tenant_id,
            provider: record.provider,
            sample_data: record.sample_data,
            collected_at: record.collected_at
          })
          .select()
        
        if (!error) {
          console.log(`✅ Migrated ${record.provider} sample data`)
          migratedCount++
          results.push({ provider: record.provider, status: 'migrated' })
        } else {
          console.log(`❌ Failed to migrate ${record.provider}:`, error.message)
          results.push({ provider: record.provider, status: 'failed', error: error.message })
        }
      } catch (err) {
        console.log(`❌ Error migrating ${record.provider}:`, (err as Error).message)
        results.push({ provider: record.provider, status: 'error', error: (err as Error).message })
      }
    }
    
    // Also migrate integration data if we have it
    const fs = require('fs')
    const path = require('path')
    const storageDir = path.join(process.cwd(), '.temp-storage')
    
    if (fs.existsSync(storageDir)) {
      const files = fs.readdirSync(storageDir)
      const integrationFiles = files.filter(f => f.startsWith('integration_'))
      
      for (const file of integrationFiles) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(storageDir, file), 'utf-8'))
          
          const { data, error } = await supabase
            .from('tenant_integrations')
            .upsert({
              tenant_id: content.tenant_id,
              provider: content.provider,
              access_token: content.access_token,
              connected_at: content.connected_at,
              status: content.status
            })
            .select()
          
          if (!error) {
            console.log(`✅ Migrated ${content.provider} integration`)
            migratedCount++
          }
        } catch (err) {
          console.log(`⚠️  Could not migrate integration file: ${file}`)
        }
      }
      
      // Migrate schema if it exists
      const schemaFiles = files.filter(f => f.startsWith('schema_'))
      for (const file of schemaFiles) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(storageDir, file), 'utf-8'))
          
          const { data, error } = await supabase
            .from('tenant_data_schemas')
            .upsert({
              tenant_id: content.tenant_id,
              providers: content.providers,
              entities: content.entities,
              created_at: new Date().toISOString()
            })
            .select()
          
          if (!error) {
            console.log(`✅ Migrated database schema`)
            migratedCount++
          }
        } catch (err) {
          console.log(`⚠️  Could not migrate schema file: ${file}`)
        }
      }
    }
    
    console.log(`🎉 Migration complete: ${migratedCount} records migrated`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedCount} records to Supabase`,
      migratedCount,
      results,
      nextSteps: [
        'Your data is now in Supabase!',
        'Test the OAuth flow again - it will use Supabase instead of temp files',
        'You can delete the .temp-storage directory if desired'
      ]
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Failed to migrate temp data' },
      { status: 500 }
    )
  }
}