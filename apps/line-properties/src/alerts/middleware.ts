import { Request, Response, NextFunction } from 'express';
import { appAlertService } from './service';

/**
 * Middleware to automatically evaluate alerts on data changes
 */
export function alertMiddleware(options: { 
  entities?: string[]; 
  operations?: ('create' | 'update' | 'delete')[] 
} = {}) {
  const { entities = [], operations = ['create', 'update', 'delete'] } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to intercept responses
    res.json = function(body: any) {
      // Check if this is a data modification operation
      const method = req.method.toLowerCase();
      const isDataOperation = ['post', 'put', 'patch', 'delete'].includes(method);
      
      if (isDataOperation && res.statusCode < 400) {
        // Extract entity from URL path
        const pathParts = req.path.split('/');
        const entityName = pathParts[2]; // assuming /api/entity-name pattern

        if (entities.length === 0 || entities.includes(entityName)) {
          // Prepare alert context
          const alertContext = {
            entity: entityName,
            operation: method === 'post' ? 'create' : 
                      method === 'delete' ? 'delete' : 'update',
            userId: req.user?.id,
            tenantId: req.tenant?.id,
            timestamp: new Date().toISOString(),
            requestData: req.body,
            responseData: body
          };

          // Evaluate alerts asynchronously (don't block response)
          setImmediate(async () => {
            try {
              await appAlertService.evaluateAlerts(body, alertContext);
            } catch (error) {
              console.error('Alert evaluation failed:', error);
            }
          });
        }
      }

      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Route handler for manual alert evaluation
 */
export async function evaluateAlerts(req: Request, res: Response) {
  try {
    const { data, context } = req.body;
    await appAlertService.evaluateAlerts(data, context);
    res.json({ success: true, message: 'Alerts evaluated successfully' });
  } catch (error) {
    console.error('Manual alert evaluation failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Route handler for testing alerts
 */
export async function testAlert(req: Request, res: Response) {
  try {
    const { ruleName } = req.params;
    const testData = req.body;
    
    await appAlertService.testAlert(ruleName, testData);
    res.json({ success: true, message: `Alert '${ruleName}' tested successfully` });
  } catch (error) {
    console.error('Alert test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Route handler for alert history
 */
export async function getAlertHistory(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const history = await appAlertService.getAlertHistory(limit);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Failed to get alert history:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Route handler for alert metrics
 */
export async function getAlertMetrics(req: Request, res: Response) {
  try {
    const metrics = await appAlertService.getAlertMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Failed to get alert metrics:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
