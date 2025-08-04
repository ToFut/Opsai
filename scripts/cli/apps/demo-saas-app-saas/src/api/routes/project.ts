
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';


const router = Router();
const prisma = new PrismaClient();



const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  ownerId: z.string(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

const projectUpdateSchema = projectSchema.partial();



// GET /projects - List all Projects
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const projects = await prisma.project.findMany({
      
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.project.count({
      
    });

    res.json({
      data: projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching Projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /projects/:id - Get single Projects
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projects not found' });
    }

    res.json({ data: project });
  } catch (error) {
    console.error('Error fetching Projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /projects - Create new Projects
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = projectSchema.parse(req.body);
    
    const project = await prisma.project.create({
      data: {
        ...validatedData
      }
    });

    res.status(201).json({ 
      data: project,
      message: 'Projects created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Error creating Projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PUT /projects/:id - Update Projects
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = projectUpdateSchema.parse(req.body);
    
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: validatedData
    });

    res.json({ 
      data: project,
      message: 'Projects updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Projects not found' });
    }
    
    console.error('Error updating Projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DELETE /projects/:id - Delete Projects
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.project.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Projects deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Projects not found' });
    }
    
    console.error('Error deleting Projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as projectRouter };
