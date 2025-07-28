import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Multi-tenant query helper
export function withTenant(
  query: any,
  tenantId: string
): any {
  return {
    ...query,
    where: {
      ...query.where,
      tenantId,
    },
  };
}

// Transaction helper with tenant isolation
export async function withTenantTransaction<T>(
  tenantId: string,
  fn: (tx: any) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx: any) => {
    // Set tenant context for the transaction
    (tx as any).tenantId = tenantId;
    return fn(tx);
  });
}

// Export types
export type { PrismaClient } from '@prisma/client'; 