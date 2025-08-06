import { Router } from 'express';
import { airbyteService, supabase } from '../server';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/connections/:userId
 * Get all connections for a user
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get connections from database
    const { data: connections, error } = await supabase
      .from('airbyte_connections')
      .select(`
        *,
        oauth_credentials!inner(
          provider,
          updated_at
        )
      `)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch connections: ${error.message}`);
    }

    // Get sync status for each connection
    const connectionsWithStatus = await Promise.all(
      (connections || []).map(async (conn) => {
        try {
          const status = await airbyteService.getSyncStatus(conn.connection_id);
          return {
            ...conn,
            lastSync: status.latestSyncJobCreatedAt,
            nextSync: status.schedule ? 
              new Date(Date.now() + status.schedule.units * 60 * 60 * 1000).toISOString() : null,
            syncStatus: status.status
          };
        } catch (error) {
          logger.warn(`Failed to get status for connection ${conn.connection_id}`);
          return conn;
        }
      })
    );

    res.json({
      connections: connectionsWithStatus,
      count: connectionsWithStatus.length
    });

  } catch (error: any) {
    logger.error('Failed to get connections:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/connections/:userId/:provider/sync
 * Trigger manual sync for a connection
 */
router.post('/:userId/:provider/sync', async (req, res) => {
  try {
    const { userId, provider } = req.params;

    // Get connection from database
    const { data: connection, error } = await supabase
      .from('airbyte_connections')
      .select('connection_id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error || !connection) {
      throw new Error(`No connection found for user ${userId}, provider ${provider}`);
    }

    // Trigger sync
    await airbyteService.triggerSync(connection.connection_id);

    res.json({
      success: true,
      message: `Sync triggered for ${provider}`,
      connectionId: connection.connection_id
    });

  } catch (error: any) {
    logger.error('Failed to trigger sync:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/connections/:userId/:provider
 * Delete a connection
 */
router.delete('/:userId/:provider', async (req, res) => {
  try {
    const { userId, provider } = req.params;

    // Get connection from database
    const { data: connection, error: fetchError } = await supabase
      .from('airbyte_connections')
      .select('connection_id, source_id, destination_id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (fetchError || !connection) {
      throw new Error(`No connection found for user ${userId}, provider ${provider}`);
    }

    // Delete from Airbyte
    await airbyteService.deleteConnection(connection.connection_id);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('airbyte_connections')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (deleteError) {
      throw new Error(`Failed to delete connection record: ${deleteError.message}`);
    }

    // Also delete OAuth credentials
    await supabase
      .from('oauth_credentials')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    res.json({
      success: true,
      message: `${provider} connection deleted successfully`
    });

  } catch (error: any) {
    logger.error('Failed to delete connection:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/connections/:userId/:provider/status
 * Get detailed status for a specific connection
 */
router.get('/:userId/:provider/status', async (req, res) => {
  try {
    const { userId, provider } = req.params;

    // Get connection from database
    const { data: connection, error } = await supabase
      .from('airbyte_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error || !connection) {
      throw new Error(`No connection found for user ${userId}, provider ${provider}`);
    }

    // Get detailed status from Airbyte
    const status = await airbyteService.getSyncStatus(connection.connection_id);

    // Get sync history
    const { data: syncHistory } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('connection_id', connection.connection_id)
      .order('started_at', { ascending: false })
      .limit(10);

    res.json({
      connection: {
        ...connection,
        status: status.status,
        lastSync: status.latestSyncJobCreatedAt,
        lastSyncStatus: status.latestSyncJobStatus
      },
      syncHistory: syncHistory || [],
      streams: status.syncCatalog?.streams || []
    });

  } catch (error: any) {
    logger.error('Failed to get connection status:', error);
    res.status(500).json({ error: error.message });
  }
});

export const ConnectionRouter = router;