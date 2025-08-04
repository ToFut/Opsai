import { NextRequest, NextResponse } from 'next/server'
import { airbyteTerraformSDK } from '@/lib/airbyte-terraform-sdk'

export async function POST(request: NextRequest) {
  try {
    const { sourceId, provider } = await request.json()
    
    console.log(`🔄 Triggering sync for ${provider} source: ${sourceId}`)
    
    // First, check if a connection exists for this source
    const connectionsResponse = await airbyteTerraformSDK.makeApiRequest(`/connections?sourceId=${sourceId}`)
    
    if (!connectionsResponse.ok) {
      throw new Error('Failed to fetch connections')
    }
    
    const connectionsData = await connectionsResponse.json()
    const connections = connectionsData.data || []
    
    if (connections.length === 0) {
      // No connection exists, we need to create one
      console.log('📝 No connection found, creating new connection...')
      
      // For demo, we'll use a simple destination
      const destinationId = await getOrCreateDestination()
      
      // Create connection
      const connectionResponse = await airbyteTerraformSDK.makeApiRequest('/connections', {
        method: 'POST',
        body: JSON.stringify({
          sourceId,
          destinationId,
          name: `${provider}_sync`,
          namespaceDefinition: 'source',
          namespaceFormat: '${SOURCE_NAMESPACE}',
          nonBreakingChangesPreference: 'ignore',
          status: 'active',
          geography: 'us',
          scheduleType: 'manual'
        })
      })
      
      if (!connectionResponse.ok) {
        const error = await connectionResponse.text()
        console.error('Failed to create connection:', error)
        throw new Error('Failed to create connection')
      }
      
      const newConnection = await connectionResponse.json()
      connections.push(newConnection)
    }
    
    // Trigger sync for all connections
    const syncResults = []
    for (const connection of connections) {
      console.log(`🚀 Triggering sync for connection: ${connection.connectionId}`)
      
      const syncResponse = await airbyteTerraformSDK.makeApiRequest('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          connectionId: connection.connectionId,
          jobType: 'sync'
        })
      })
      
      if (syncResponse.ok) {
        const job = await syncResponse.json()
        syncResults.push({
          connectionId: connection.connectionId,
          jobId: job.jobId,
          status: 'started'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      provider,
      connections: connections.length,
      syncs: syncResults
    })
    
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 }
    )
  }
}

async function getOrCreateDestination() {
  // For demo purposes, return a test destination
  // In production, this would create/return the tenant's specific destination
  return 'test-destination-id'
}