import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './middleware/auth';
import { tenantMiddleware } from './middleware/tenant';
import { errorHandler } from './middleware/error';
import { contactRouter } from './routes/contact';
import { dealRouter } from './routes/deal';

const app = express();
const prisma = new PrismaClient();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../../public')));

// Health check (before auth)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    app: 'my-crm-system'
  });
});

// Demo routes (no auth for testing)
app.get('/demo/contacts', async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      include: { deals: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: contacts, message: 'Demo CRM data' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

app.get('/demo/deals', async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      include: { contact: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: deals, message: 'Demo CRM data' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// Auth middleware for API routes
app.use('/api', authMiddleware);
app.use('/api', tenantMiddleware);

// API Routes
app.use('/api/contacts', contactRouter);
app.use('/api/deals', dealRouter);

// Error handling
app.use(errorHandler);

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// 404 handler for all other routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 My Crm System API server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
