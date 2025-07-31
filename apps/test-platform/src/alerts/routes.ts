import { Router } from 'express';
import { 
  evaluateAlerts, 
  testAlert, 
  getAlertHistory, 
  getAlertMetrics 
} from './middleware';

const router = Router();

// Manual alert evaluation
router.post('/evaluate', evaluateAlerts);

// Test specific alert rule
router.post('/test/:ruleName', testAlert);

// Get alert history
router.get('/history', getAlertHistory);

// Get alert metrics
router.get('/metrics', getAlertMetrics);

export { router as alertRouter };
