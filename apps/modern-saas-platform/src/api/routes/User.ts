
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();
const prisma = new PrismaClient();



const UserSchema = z.object({
  id: z.string().optional(),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  name: z.string(),
  role: z.string().optional(),
  organizationId: z.string(),
  isActive: z.boolean().optional(),
  lastLogin: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

const UserUpdateSchema = UserSchema.partial();



// GET /Users - List all Users
router.get('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const Users = await prisma.User.findMany({
      where: { tenantId: req.tenant.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.User.count({
      where: { tenantId: req.tenant.id },
    });

    res.json({
      data: Users,
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


// GET /Users/:id - Get single Users
router.get('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const User = await prisma.User.findUnique({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });

    if (!User) {
      return res.status(404).json({ error: 'Users not found' });
    }

    res.json({ data: User });
  } catch (error) {
    console.error('Error fetching Users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /Users - Create new Users
router.post('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = UserSchema.parse(req.body);
    
    const User = await prisma.User.create({
      data: {
        ...validatedData, tenantId: req.tenant.id
      }
    });

    res.status(201).json({ 
      data: User,
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


// PUT /Users/:id - Update Users
router.put('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = UserUpdateSchema.parse(req.body);
    
    const User = await prisma.User.update({
      where: { id: req.params.id, tenantId: req.tenant.id },
      data: validatedData
    });

    res.json({ 
      data: User,
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


// DELETE /Users/:id - Delete Users
router.delete('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    await prisma.User.delete({
      where: { id: req.params.id, tenantId: req.tenant.id }
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

export { router as UserRouter };
