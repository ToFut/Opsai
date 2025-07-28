
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();
const prisma = new PrismaClient();



const dealSchema = z.object({
  id: z.string(),
  title: z.string(),
  value: z.number(),
  stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost']),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.date().optional(),
  notes: z.string().optional(),
  createdAt: z.date()
});

const dealUpdateSchema = dealSchema.partial();



// GET /deals - List all Deals
router.get('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const deals = await prisma.deal.findMany({
      where: { tenantId: req.tenant.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.deal.count({
      where: { tenantId: req.tenant.id },
    });

    res.json({
      data: deals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching Deals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /deals/:id - Get single Deals
router.get('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deals not found' });
    }

    res.json({ data: deal });
  } catch (error) {
    console.error('Error fetching Deals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /deals - Create new Deals
router.post('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = dealSchema.parse(req.body);
    
    const deal = await prisma.deal.create({
      data: {
        ...validatedData, tenantId: req.tenant.id
      }
    });

    res.status(201).json({ 
      data: deal,
      message: 'Deals created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Error creating Deals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PUT /deals/:id - Update Deals
router.put('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = dealUpdateSchema.parse(req.body);
    
    const deal = await prisma.deal.update({
      where: { id: req.params.id, tenantId: req.tenant.id },
      data: validatedData
    });

    res.json({ 
      data: deal,
      message: 'Deals updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Deals not found' });
    }
    
    console.error('Error updating Deals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DELETE /deals/:id - Delete Deals
router.delete('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    await prisma.deal.delete({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });

    res.json({ message: 'Deals deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Deals not found' });
    }
    
    console.error('Error deleting Deals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as dealRouter };
