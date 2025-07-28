
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();
const prisma = new PrismaClient();



const contactSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  status: z.enum(['new', 'qualified', 'customer', 'inactive']),
  source: z.enum(['website', 'referral', 'advertisement', 'cold-call', 'social-media']).optional(),
  notes: z.string().optional(),
  createdAt: z.date()
});

const contactUpdateSchema = contactSchema.partial();



// GET /contacts - List all Contacts
router.get('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const contacts = await prisma.contact.findMany({
      where: { tenantId: req.tenant.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.contact.count({
      where: { tenantId: req.tenant.id },
    });

    res.json({
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching Contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /contacts/:id - Get single Contacts
router.get('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contacts not found' });
    }

    res.json({ data: contact });
  } catch (error) {
    console.error('Error fetching Contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /contacts - Create new Contacts
router.post('/', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = contactSchema.parse(req.body);
    
    const contact = await prisma.contact.create({
      data: {
        ...validatedData, tenantId: req.tenant.id
      }
    });

    res.status(201).json({ 
      data: contact,
      message: 'Contacts created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Error creating Contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PUT /contacts/:id - Update Contacts
router.put('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    const validatedData = contactUpdateSchema.parse(req.body);
    
    const contact = await prisma.contact.update({
      where: { id: req.params.id, tenantId: req.tenant.id },
      data: validatedData
    });

    res.json({ 
      data: contact,
      message: 'Contacts updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Contacts not found' });
    }
    
    console.error('Error updating Contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DELETE /contacts/:id - Delete Contacts
router.delete('/:id', requireAuth, requireTenant, async (req: Request, res: Response) => {
  try {
    await prisma.contact.delete({
      where: { id: req.params.id, tenantId: req.tenant.id }
    });

    res.json({ message: 'Contacts deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Contacts not found' });
    }
    
    console.error('Error deleting Contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as contactRouter };
