import { Router } from 'express';
import { supabase } from '../server';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/data-sync/:userId/status
 * Get data sync status for all providers
 */
router.get('/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check for data in user's schema for each provider
    const providers = ['stripe', 'quickbooks', 'shopify', 'google_analytics'];
    const schema = `user_${userId.replace(/-/g, '_')}`;
    
    const status = await Promise.all(
      providers.map(async (provider) => {
        const tables = getProviderTables(provider);
        const tableStatus = await Promise.all(
          tables.map(async (table) => {
            const query = `
              SELECT COUNT(*) as count,
                     MAX(created_at) as last_updated
              FROM ${schema}.${table}
            `;
            
            try {
              const { data, error } = await supabase.rpc('execute_sql', { 
                query,
                params: []
              });
              
              return {
                table,
                hasData: data?.[0]?.count > 0,
                recordCount: data?.[0]?.count || 0,
                lastUpdated: data?.[0]?.last_updated
              };
            } catch (error) {
              return {
                table,
                hasData: false,
                recordCount: 0,
                lastUpdated: null,
                error: error.message
              };
            }
          })
        );

        return {
          provider,
          connected: tableStatus.some(t => t.hasData),
          tables: tableStatus,
          totalRecords: tableStatus.reduce((sum, t) => sum + t.recordCount, 0)
        };
      })
    );

    res.json({ status });

  } catch (error: any) {
    logger.error('Failed to get data sync status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/data-sync/:userId/:provider/data
 * Get synced data for a specific provider
 */
router.get('/:userId/:provider/data', async (req, res) => {
  try {
    const { userId, provider } = req.params;
    const { table, limit = 100, offset = 0 } = req.query;

    const schema = `user_${userId.replace(/-/g, '_')}`;
    const tables = table ? [table as string] : getProviderTables(provider);

    const data: Record<string, any> = {};

    for (const tableName of tables) {
      const query = `
        SELECT * FROM ${schema}.${tableName}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      try {
        const { data: tableData, error } = await supabase.rpc('execute_sql', {
          query,
          params: []
        });

        if (!error) {
          data[tableName] = tableData;
        }
      } catch (error) {
        logger.warn(`Failed to fetch data from ${tableName}:`, error);
        data[tableName] = { error: error.message };
      }
    }

    res.json({ 
      provider,
      schema,
      data,
      pagination: {
        limit: Number(limit),
        offset: Number(offset)
      }
    });

  } catch (error: any) {
    logger.error('Failed to get provider data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/data-sync/:userId/analytics
 * Get analytics data across all providers
 */
router.get('/:userId/analytics', async (req, res) => {
  try {
    const { userId } = req.params;
    const schema = `user_${userId.replace(/-/g, '_')}`;

    const analytics: Record<string, any> = {};

    // Revenue analytics (Stripe)
    try {
      const revenueQuery = `
        SELECT 
          DATE_TRUNC('month', created) as month,
          COUNT(*) as transaction_count,
          SUM(amount) / 100 as revenue
        FROM ${schema}.stripe_charges
        WHERE status = 'succeeded'
        GROUP BY DATE_TRUNC('month', created)
        ORDER BY month DESC
        LIMIT 12
      `;

      const { data: revenueData } = await supabase.rpc('execute_sql', {
        query: revenueQuery,
        params: []
      });

      analytics.revenue = revenueData || [];
    } catch (error) {
      logger.warn('No Stripe data available');
    }

    // Customer analytics (multiple sources)
    try {
      const customerQuery = `
        SELECT 
          COUNT(DISTINCT email) as total_customers,
          COUNT(DISTINCT CASE WHEN created > NOW() - INTERVAL '30 days' THEN email END) as new_customers_30d
        FROM ${schema}.stripe_customers
      `;

      const { data: customerData } = await supabase.rpc('execute_sql', {
        query: customerQuery,
        params: []
      });

      analytics.customers = customerData?.[0] || {};
    } catch (error) {
      logger.warn('No customer data available');
    }

    // Order analytics (Shopify)
    try {
      const orderQuery = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(total_price) as total_revenue,
          AVG(total_price) as average_order_value
        FROM ${schema}.shopify_orders
      `;

      const { data: orderData } = await supabase.rpc('execute_sql', {
        query: orderQuery,
        params: []
      });

      analytics.orders = orderData?.[0] || {};
    } catch (error) {
      logger.warn('No Shopify data available');
    }

    res.json({ analytics });

  } catch (error: any) {
    logger.error('Failed to get analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/data-sync/:userId/refresh
 * Trigger refresh for all connected providers
 */
router.post('/:userId/refresh', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all connections for user
    const { data: connections, error } = await supabase
      .from('airbyte_connections')
      .select('connection_id, provider')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch connections: ${error.message}`);
    }

    if (!connections || connections.length === 0) {
      return res.json({
        message: 'No connections to refresh',
        refreshed: []
      });
    }

    // Trigger sync for each connection
    const results = await Promise.all(
      connections.map(async (conn) => {
        try {
          const { airbyteService } = await import('../services/airbyte-service');
          const service = new airbyteService();
          await service.triggerSync(conn.connection_id);
          return { provider: conn.provider, status: 'triggered' };
        } catch (error) {
          return { provider: conn.provider, status: 'failed', error: error.message };
        }
      })
    );

    res.json({
      message: 'Refresh triggered for all connections',
      refreshed: results
    });

  } catch (error: any) {
    logger.error('Failed to refresh data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper function to get tables for a provider
 */
function getProviderTables(provider: string): string[] {
  const tableMap: Record<string, string[]> = {
    stripe: [
      'stripe_customers',
      'stripe_charges',
      'stripe_invoices',
      'stripe_subscriptions',
      'stripe_products'
    ],
    quickbooks: [
      'quickbooks_customers',
      'quickbooks_invoices',
      'quickbooks_items',
      'quickbooks_payments',
      'quickbooks_accounts'
    ],
    shopify: [
      'shopify_customers',
      'shopify_orders',
      'shopify_products',
      'shopify_line_items',
      'shopify_inventory_items'
    ],
    google_analytics: [
      'ga_website_overview',
      'ga_traffic_sources',
      'ga_page_views',
      'ga_user_sessions'
    ]
  };

  return tableMap[provider] || [];
}

export const DataSyncRouter = router;