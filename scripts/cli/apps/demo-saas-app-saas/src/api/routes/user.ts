
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';


const router = Router();
const prisma = new PrismaClient();



const userSchema = z.object({
  id: z.string(),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  name: z.string(),
  role: z.enum(['admin', 'user', 'viewer']),
  isActive: z.boolean().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

const userUpdateSchema = userSchema.partial();



// GET /users - List all Users
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({
      
    });

    res.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching Users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /users/:id - Get single Users
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Users not found' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Error fetching Users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /users - Create new Users
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = userSchema.parse(req.body);
    
    const user = await prisma.user.create({
      data: {
        ...validatedData
      }
    });

    res.status(201).json({ 
      data: user,
      message: 'Users created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Error creating Users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PUT /users/:id - Update Users
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = userUpdateSchema.parse(req.body);
    
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: validatedData
    });

    res.json({ 
      data: user,
      message: 'Users updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Users not found' });
    }
    
    console.error('Error updating Users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DELETE /users/:id - Delete Users
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Users deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Users not found' });
    }
    
    console.error('Error deleting Users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as userRouter };
