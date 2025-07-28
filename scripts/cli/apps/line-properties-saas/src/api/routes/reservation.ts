
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();
const prisma = new PrismaClient();



const reservationSchema = z.object({
  id: z.string(),
  checkIn: z.date(),
  checkOut: z.date(),
  totalPrice: z.number(),
  status: z.enum(['pending', 'confirmed', 'cancelled']),
  createdAt: z.date()
});

const reservationUpdateSchema = reservationSchema.partial();



// GET /reservations - List all Reservations
router.get('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const reservations = await prisma.reservation.findMany({
      where: { tenantId: req.tenant.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.reservation.count({
      where: { tenantId: req.tenant.id },
    });

    res.json({
      data: reservations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching Reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /reservations/:id - Get single Reservations
router.get('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservations not found' });
    }

    res.json({ data: reservation });
  } catch (error) {
    console.error('Error fetching Reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /reservations - Create new Reservations
router.post('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = reservationSchema.parse(req.body);
    
    const reservation = await prisma.reservation.create({
      data: {
        ...validatedData, tenantId: req.tenant.id
      }
    });

    res.status(201).json({ 
      data: reservation,
      message: 'Reservations created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Error creating Reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PUT /reservations/:id - Update Reservations
router.put('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = reservationUpdateSchema.parse(req.body);
    
    const reservation = await prisma.reservation.update({
      where: { id: req.params.id, tenantId: req.tenant.id },
      data: validatedData
    });

    res.json({ 
      data: reservation,
      message: 'Reservations updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Reservations not found' });
    }
    
    console.error('Error updating Reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DELETE /reservations/:id - Delete Reservations
router.delete('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    await prisma.reservation.delete({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });

    res.json({ message: 'Reservations deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Reservations not found' });
    }
    
    console.error('Error deleting Reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as reservationRouter };
