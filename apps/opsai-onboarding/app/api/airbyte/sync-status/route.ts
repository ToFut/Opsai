import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { airbyteTerraformSDK } from '@/lib/airbyte-terraform-sdk'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId') || 'default'
    
    console.log(`📊 Checking Airbyte sync status for tenant: ${tenantId}`)
    
    // Get connections for this tenant
    const { data: connections, error } = await supabase
      .from('tenant_airbyte_connections')
      .select('*')
      .eq('tenant_id', tenantId)
    
    if (error || !connections) {
      return NextResponse.json({ 
        error: 'No connections found',
        tenantId 
      }, { status: 404 })
    }
    
    // Check sync status for each connection
    const syncStatuses = await Promise.all(
      connections.map(async (conn) => {
        try {
          // Get connection details from Airbyte
          const response = await airbyteTerraformSDK.makeApiRequest(`/connections/${conn.connection_id}`)
          
          if (!response.ok) {
            return {
              provider: conn.provider,
              connectionId: conn.connection_id,
              status: 'error',
              error: 'Connection not found in Airbyte'
            }
          }
          
          const connectionData = await response.json()
          
          // Get latest sync job
          const jobsResponse = await airbyteTerraformSDK.makeApiRequest(`/jobs?connectionId=${conn.connection_id}&limit=1`)
          const jobsData = await jobsResponse.json()
          
          const latestJob = jobsData.data?.[0]
          
          return {
            provider: conn.provider,
            connectionId: conn.connection_id,
            status: connectionData.status,
            schedule: connectionData.schedule,
            lastSync: latestJob ? {
              status: latestJob.status,
              startedAt: latestJob.startedAt,
              endedAt: latestJob.endedAt,
              recordsSynced: latestJob.attempts?.[0]?.recordsSynced || 0
            } : null,
            nextSync: calculateNextSync(connectionData.schedule, latestJob?.endedAt)
          }
        } catch (error) {
          return {
            provider: conn.provider,
            connectionId: conn.connection_id,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )
    
    // Check if actual data has been synced to Supabase
    const dataCheck = await checkSyncedData(tenantId)
    
    return NextResponse.json({
      tenantId,
      connections: syncStatuses,
      dataInSupabase: dataCheck,
      summary: {
        total: connections.length,
        active: syncStatuses.filter(s => s.status === 'active').length,
        synced: syncStatuses.filter(s => s.lastSync?.status === 'succeeded').length
      }
    })
    
  } catch (error) {
    console.error('Sync status check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function calculateNextSync(schedule: any, lastSyncTime?: string): string | null {
  if (!schedule || schedule.scheduleType === 'manual') {
    return null
  }
  
  if (schedule.scheduleType === 'cron' && schedule.cronExpression && lastSyncTime) {
    // Simple calculation for "every 6 hours"
    const lastSync = new Date(lastSyncTime)
    const nextSync = new Date(lastSync.getTime() + 6 * 60 * 60 * 1000)
    return nextSync.toISOString()
  }
  
  return null
}

async function checkSyncedData(tenantId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Check for tables created by Airbyte (they typically have prefixes)
  const tables = [
    `opsai_${tenantId}_github_users`,
    `opsai_${tenantId}_github_repositories`,
    `opsai_${tenantId}_github_issues`,
    `opsai_${tenantId}_google_analytics_accounts`,
    `opsai_${tenantId}_google_analytics_sessions`
  ]
  
  const tableChecks = await Promise.all(
    tables.map(async (tableName) => {
      try {
        // Try to query the table
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        return {
          table: tableName,
          exists: !error,
          recordCount: count || 0
        }
      } catch (error) {
        return {
          table: tableName,
          exists: false,
          recordCount: 0
        }
      }
    })
  )
  
  return {
    tables: tableChecks,
    hasSyncedData: tableChecks.some(t => t.exists && t.recordCount > 0)
  }
}