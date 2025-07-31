import { PrismaClient } from '@prisma/client';
export interface SeedData {
    table: string;
    data: Record<string, any>[];
}
export declare class DatabaseSeeder {
    private prisma;
    constructor(prisma: PrismaClient);
    seedDatabase(seedData: SeedData[]): Promise<void>;
    private seedTable;
    clearTable(tableName: string): Promise<void>;
    clearAllTables(): Promise<void>;
}
//# sourceMappingURL=seed.d.ts.map