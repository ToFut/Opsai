#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🚀 Applying Supabase migration for multi-tenant management...')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_multi_tenant_schema.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split by semicolon but be careful with functions that contain semicolons
    const statements = migrationSQL
      .split(/;(?![^$]*\$\$)/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip empty statements
      if (!statement.trim()) continue

      // Log the type of statement
      const statementType = statement.trim().split(' ')[0].toUpperCase()
      console.log(`   ${i + 1}. Executing ${statementType}...`)

      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      })

      if (error) {
        // Check if it's a "already exists" error which we can ignore
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Object already exists, skipping...`)
        } else {
          throw error
        }
      }
    }

    console.log('✅ Migration applied successfully!')

    // Verify tables were created
    console.log('\n📊 Verifying tables...')
    const tables = [
      'tenants',
      'tenant_integrations', 
      'tenant_sources',
      'tenant_airbyte_connections',
      'oauth_states',
      'tenant_apps',
      'tenant_workflows',
      'audit_logs'
    ]

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`   ❌ Table '${table}' - Error: ${error.message}`)
      } else {
        console.log(`   ✅ Table '${table}' - Ready`)
      }
    }

    // Insert test data
    console.log('\n🧪 Inserting test tenant...')
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .upsert({
        tenant_id: 'demo_tenant',
        name: 'Demo Company',
        business_profile: {
          industry: 'saas',
          size: 'medium',
          type: 'b2b',
          description: 'A demo SaaS company for testing'
        },
        status: 'active',
        subscription_tier: 'pro'
      })
      .select()
      .single()

    if (tenantError && !tenantError.message.includes('duplicate')) {
      console.log(`   ❌ Error creating test tenant: ${tenantError.message}`)
    } else {
      console.log(`   ✅ Test tenant ready: demo_tenant`)
    }

    console.log('\n🎉 Database setup complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. The database is now ready for multi-tenant operations')
    console.log('   2. Users can connect integrations through Airbyte')
    console.log('   3. Each tenant gets isolated resources and data')
    console.log('   4. Apps will be generated with tenant-specific configurations')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Alternative: Direct SQL execution if RPC doesn't work
async function applyMigrationDirect() {
  console.log('🚀 Applying migration using direct SQL...')
  
  // Note: Supabase JS client doesn't support direct SQL execution
  // You would need to use the Supabase CLI or SQL editor for this
  console.log('\n📝 To apply this migration:')
  console.log('   1. Go to your Supabase dashboard')
  console.log('   2. Navigate to SQL Editor')
  console.log('   3. Copy the contents of supabase/migrations/001_multi_tenant_schema.sql')
  console.log('   4. Paste and run in the SQL editor')
  console.log('\nOr use Supabase CLI:')
  console.log('   supabase db push')
}

// Check if we can use RPC
async function checkRPCAvailable() {
  const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
  return !error
}

// Main execution
async function main() {
  const rpcAvailable = await checkRPCAvailable()
  
  if (rpcAvailable) {
    await applyMigration()
  } else {
    console.log('⚠️  RPC function not available, showing manual instructions...')
    await applyMigrationDirect()
  }
}

main().catch(console.error)