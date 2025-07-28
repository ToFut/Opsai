import { PrismaClient } from '@prisma/client';
declare global {
    var __prisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare function withTenant(query: any, tenantId: string): any;
export declare function withTenantTransaction<T>(tenantId: string, fn: (tx: any) => Promise<T>): Promise<T>;
export type { PrismaClient } from '@prisma/client';
//# sourceMappingURL=client.d.ts.map