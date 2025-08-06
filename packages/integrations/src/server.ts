import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { OAuthRouter } from './api/oauth';
import { DataSyncRouter } from './api/data-sync';
import { ConnectionRouter } from './api/connections';
import { TerraformService } from './services/terraform-service';
import { AirbyteService } from './services/airbyte-service';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const port = process.env.INTEGRATION_PORT || 3005;

// Initialize Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Initialize services
export const terraformService = new TerraformService();
export const airbyteService = new AirbyteService();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'integrations',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/oauth', OAuthRouter);
app.use('/api/connections', ConnectionRouter);
app.use('/api/data-sync', DataSyncRouter);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(port, () => {
  logger.info(`🚀 Integration service running on port ${port}`);
});

export default app;