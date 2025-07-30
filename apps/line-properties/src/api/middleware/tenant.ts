
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TenantRequest extends Request {
  tenant?: any;
}

export async function tenantMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const tenantSlug = req.header('X-Tenant') || req.query.tenant as string;
    
    if (!tenantSlug) {
      return res.status(400).json({ error: 'Tenant identifier required' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function requireTenant(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.tenant) {
    return res.status(400).json({ error: 'Tenant context required' });
  }
  next();
}
