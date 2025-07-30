
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { guestyApiClient } from '../../integrations/guesty_api';
import { dataSyncService } from '../../integrations/data-sync';

// Extend Request type to include tenant
interface TenantRequest extends Request {
  tenant?: { id: string; name: string; slug: string };
}

const router = Router();
const prisma = new PrismaClient();



const PropertySchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  address: z.string(),
  city: z.string(),
  price: z.string(),
  bedrooms: z.string(),
  bathrooms: z.string(),
  amenities: z.any().optional(),
  images: z.any().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

const PropertyUpdateSchema = PropertySchema.partial();



// GET /properties - List all Properties (REAL GUESTY DATA WITH SYNC)
router.get('/', async (req: any, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // 🚀 USE NEW DATA SYNC SERVICE
    const result = await dataSyncService.getCombinedProperties(page, limit);
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ Error fetching properties:', error);
    
    // Ultimate fallback - return empty with proper structure
    res.json({
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0
      },
      sources: {
        guesty: 0,
        local: 0
      }
    });
  }
});

// POST /properties/sync - Manual sync from Guesty API
router.post('/sync', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Manual sync requested...');
    const result = await dataSyncService.syncProperties();
    
    res.json({
      success: true,
      message: `Sync completed: ${result.synced} properties synced, ${result.errors} errors`,
      synced: result.synced,
      errors: result.errors
    });
  } catch (error: any) {
    console.error('❌ Manual sync failed:', error);
    res.status(500).json({
      success: false,
      message: 'Sync failed',
      error: error.message
    });
  }
});

// GET /Propertys/:id - Get single Properties
router.get('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const Property = await prisma.Property.findUnique({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });

    if (!Property) {
      return res.status(404).json({ error: 'Properties not found' });
    }

    res.json({ data: Property });
  } catch (error) {
    console.error('Error fetching Properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /Propertys - Create new Properties
router.post('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = PropertySchema.parse(req.body);
    
    const Property = await prisma.Property.create({
      data: {
        ...validatedData, tenantId: req.tenant.id
      }
    });

    res.status(201).json({ 
      data: Property,
      message: 'Properties created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Error creating Properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PUT /Propertys/:id - Update Properties
router.put('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = PropertyUpdateSchema.parse(req.body);
    
    const Property = await prisma.Property.update({
      where: { id: req.params.id, tenantId: req.tenant.id },
      data: validatedData
    });

    res.json({ 
      data: Property,
      message: 'Properties updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Properties not found' });
    }
    
    console.error('Error updating Properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DELETE /Propertys/:id - Delete Properties
router.delete('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    await prisma.Property.delete({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });

    res.json({ message: 'Properties deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Properties not found' });
    }
    
    console.error('Error deleting Properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as PropertyRouter };
