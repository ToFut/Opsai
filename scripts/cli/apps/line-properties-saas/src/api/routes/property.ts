
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();
const prisma = new PrismaClient();



const propertySchema = z.object({
  id: z.string(),
  title: z.string(),
  address: z.string(),
  city: z.string(),
  price: z.number(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  amenities: z.any().optional(),
  images: z.any().optional(),
  status: z.enum(['available', 'booked', 'maintenance']),
  createdAt: z.date()
});

const propertyUpdateSchema = propertySchema.partial();



// GET /propertys - List all Properties
router.get('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const propertys = await prisma.property.findMany({
      where: { tenantId: req.tenant.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.property.count({
      where: { tenantId: req.tenant.id },
    });

    res.json({
      data: propertys,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching Properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /propertys/:id - Get single Properties
router.get('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });

    if (!property) {
      return res.status(404).json({ error: 'Properties not found' });
    }

    res.json({ data: property });
  } catch (error) {
    console.error('Error fetching Properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /propertys - Create new Properties
router.post('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = propertySchema.parse(req.body);
    
    const property = await prisma.property.create({
      data: {
        ...validatedData, tenantId: req.tenant.id
      }
    });

    res.status(201).json({ 
      data: property,
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


// PUT /propertys/:id - Update Properties
router.put('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = propertyUpdateSchema.parse(req.body);
    
    const property = await prisma.property.update({
      where: { id: req.params.id, tenantId: req.tenant.id },
      data: validatedData
    });

    res.json({ 
      data: property,
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


// DELETE /propertys/:id - Delete Properties
router.delete('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    await prisma.property.delete({
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

export { router as propertyRouter };
