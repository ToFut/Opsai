
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';


const router: Router = Router();
const prisma = new PrismaClient();



const TaskSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  projectId: z.string(),
  assignedTo: z.string().optional(),
  createdBy: z.string(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  estimatedHours: z.string().optional(),
  actualHours: z.string().optional(),
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

const TaskUpdateSchema = TaskSchema.partial();



// GET /Tasks - List all Tasks
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const Tasks = await prisma.Task.findMany({
      
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.Task.count({
      
    });

    res.json({
      data: Tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching Tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /Tasks/:id - Get single Tasks
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const Task = await prisma.Task.findUnique({
      where: { id: req.params.id }
    });

    if (!Task) {
      return res.status(404).json({ error: 'Tasks not found' });
    }

    res.json({ data: Task });
  } catch (error) {
    console.error('Error fetching Tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /Tasks - Create new Tasks
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = TaskSchema.parse(req.body);
    
    const Task = await prisma.Task.create({
      data: {
        ...validatedData
      }
    });

    res.status(201).json({ 
      data: Task,
      message: 'Tasks created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Error creating Tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PUT /Tasks/:id - Update Tasks
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = TaskUpdateSchema.parse(req.body);
    
    const Task = await prisma.Task.update({
      where: { id: req.params.id },
      data: validatedData
    });

    res.json({ 
      data: Task,
      message: 'Tasks updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tasks not found' });
    }
    
    console.error('Error updating Tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DELETE /Tasks/:id - Delete Tasks
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.Task.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Tasks deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tasks not found' });
    }
    
    console.error('Error deleting Tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as TaskRouter };
