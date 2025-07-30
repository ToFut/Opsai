
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();
const prisma = new PrismaClient();



const ReservationSchema = z.object({
  id: z.string().optional(),
  propertyId: z.string(),
  guestId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  totalPrice: z.string(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

const ReservationUpdateSchema = ReservationSchema.partial();



// GET /Reservations - List all Reservations
router.get('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const Reservations = await prisma.Reservation.findMany({
      where: { tenantId: req.tenant.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.Reservation.count({
      where: { tenantId: req.tenant.id },
    });

    res.json({
      data: Reservations,
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


// GET /Reservations/:id - Get single Reservations
router.get('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const Reservation = await prisma.Reservation.findUnique({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });

    if (!Reservation) {
      return res.status(404).json({ error: 'Reservations not found' });
    }

    res.json({ data: Reservation });
  } catch (error) {
    console.error('Error fetching Reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /Reservations - Create new Reservations
router.post('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = ReservationSchema.parse(req.body);
    
    const Reservation = await prisma.Reservation.create({
      data: {
        ...validatedData, tenantId: req.tenant.id
      }
    });

    res.status(201).json({ 
      data: Reservation,
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


// PUT /Reservations/:id - Update Reservations
router.put('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = ReservationUpdateSchema.parse(req.body);
    
    const Reservation = await prisma.Reservation.update({
      where: { id: req.params.id, tenantId: req.tenant.id },
      data: validatedData
    });

    res.json({ 
      data: Reservation,
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


// DELETE /Reservations/:id - Delete Reservations
router.delete('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    await prisma.Reservation.delete({
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

export { router as ReservationRouter };
