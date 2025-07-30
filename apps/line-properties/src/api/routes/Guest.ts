
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();
const prisma = new PrismaClient();



const GuestSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  phone: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

const GuestUpdateSchema = GuestSchema.partial();



// GET /Guests - List all Guests
router.get('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const Guests = await prisma.Guest.findMany({
      where: { tenantId: req.tenant.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.Guest.count({
      where: { tenantId: req.tenant.id },
    });

    res.json({
      data: Guests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching Guests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /Guests/:id - Get single Guests
router.get('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const Guest = await prisma.Guest.findUnique({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });

    if (!Guest) {
      return res.status(404).json({ error: 'Guests not found' });
    }

    res.json({ data: Guest });
  } catch (error) {
    console.error('Error fetching Guests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /Guests - Create new Guests
router.post('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = GuestSchema.parse(req.body);
    
    const Guest = await prisma.Guest.create({
      data: {
        ...validatedData, tenantId: req.tenant.id
      }
    });

    res.status(201).json({ 
      data: Guest,
      message: 'Guests created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Error creating Guests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PUT /Guests/:id - Update Guests
router.put('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = GuestUpdateSchema.parse(req.body);
    
    const Guest = await prisma.Guest.update({
      where: { id: req.params.id, tenantId: req.tenant.id },
      data: validatedData
    });

    res.json({ 
      data: Guest,
      message: 'Guests updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Guests not found' });
    }
    
    console.error('Error updating Guests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DELETE /Guests/:id - Delete Guests
router.delete('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    await prisma.Guest.delete({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });

    res.json({ message: 'Guests deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Guests not found' });
    }
    
    console.error('Error deleting Guests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as GuestRouter };
