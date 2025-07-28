"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.withTenant = withTenant;
exports.withTenantTransaction = withTenantTransaction;
const client_1 = require("@prisma/client");
exports.prisma = globalThis.__prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = exports.prisma;
}
// Multi-tenant query helper
function withTenant(query, tenantId) {
    return {
        ...query,
        where: {
            ...query.where,
            tenantId,
        },
    };
}
// Transaction helper with tenant isolation
async function withTenantTransaction(tenantId, fn) {
    return exports.prisma.$transaction(async (tx) => {
        // Set tenant context for the transaction
        tx.tenantId = tenantId;
        return fn(tx);
    });
}
//# sourceMappingURL=client.js.map