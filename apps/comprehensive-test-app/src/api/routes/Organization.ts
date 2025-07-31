
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';


const router: Router = Router();
const prisma = new PrismaClient();



const OrganizationSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  slug: z.string().optional(),
  domain: z.string().optional(),
  plan: z.enum(['starter', 'professional', 'enterprise']).optional(),
  billingEmail: z.string(),
  settings: z.string().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

const OrganizationUpdateSchema = OrganizationSchema.partial();



// GET /Organizations - List all Organizations
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const Organizations = await prisma.Organization.findMany({
      
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.Organization.count({
      
    });

    res.json({
      data: Organizations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching Organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /Organizations/:id - Get single Organizations
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const Organization = await prisma.Organization.findUnique({
      where: { id: req.params.id }
    });

    if (!Organization) {
      return res.status(404).json({ error: 'Organizations not found' });
    }

    res.json({ data: Organization });
  } catch (error) {
    console.error('Error fetching Organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /Organizations - Create new Organizations
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = OrganizationSchema.parse(req.body);
    
    const Organization = await prisma.Organization.create({
      data: {
        ...validatedData
      }
    });

    res.status(201).json({ 
      data: Organization,
      message: 'Organizations created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Error creating Organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PUT /Organizations/:id - Update Organizations
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = OrganizationUpdateSchema.parse(req.body);
    
    const Organization = await prisma.Organization.update({
      where: { id: req.params.id },
      data: validatedData
    });

    res.json({ 
      data: Organization,
      message: 'Organizations updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Organizations not found' });
    }
    
    console.error('Error updating Organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DELETE /Organizations/:id - Delete Organizations
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.Organization.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Organizations deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Organizations not found' });
    }
    
    console.error('Error deleting Organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as OrganizationRouter };
