
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';


const router: Router = Router();
const prisma = new PrismaClient();



const ProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  organizationId: z.string(),
  ownerId: z.string(),
  status: z.enum(['planning', 'active', 'completed', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  budget: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  tags: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

const ProjectUpdateSchema = ProjectSchema.partial();



// GET /Projects - List all Projects
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const Projects = await prisma.Project.findMany({
      
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.Project.count({
      
    });

    res.json({
      data: Projects,
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


// GET /Projects/:id - Get single Projects
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const Project = await prisma.Project.findUnique({
      where: { id: req.params.id }
    });

    if (!Project) {
      return res.status(404).json({ error: 'Projects not found' });
    }

    res.json({ data: Project });
  } catch (error) {
    console.error('Error fetching Projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /Projects - Create new Projects
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = ProjectSchema.parse(req.body);
    
    const Project = await prisma.Project.create({
      data: {
        ...validatedData
      }
    });

    res.status(201).json({ 
      data: Project,
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


// PUT /Projects/:id - Update Projects
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = ProjectUpdateSchema.parse(req.body);
    
    const Project = await prisma.Project.update({
      where: { id: req.params.id },
      data: validatedData
    });

    res.json({ 
      data: Project,
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


// DELETE /Projects/:id - Delete Projects
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.Project.delete({
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

export { router as ProjectRouter };
