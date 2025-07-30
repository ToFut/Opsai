"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseActivity = void 0;
const activity_1 = require("@temporalio/activity");
const database_1 = require("@opsai/database");
const base_activity_1 = require("./base-activity");
const errors_1 = require("../errors");
class DatabaseActivity extends base_activity_1.BaseActivity {
    async execute(input) {
        const { operation, table, data, where, select, include, orderBy, take, skip, tenantId } = input;
        // Get activity context for heartbeat and cancellation
        const context = activity_1.Context.current();
        try {
            console.log(`[Database Activity] Executing ${operation} on ${table}`);
            // Add tenant isolation to where clause
            const tenantWhere = where ? { ...where, tenantId } : { tenantId };
            let result;
            switch (operation) {
                case 'create':
                    if (!data) {
                        throw new errors_1.ActivityError('Data is required for create operation');
                    }
                    result = await database_1.prisma[table].create({
                        data: { ...data, tenantId },
                        select,
                        include
                    });
                    break;
                case 'read':
                    if (!where) {
                        throw new errors_1.ActivityError('Where clause is required for read operation');
                    }
                    result = await database_1.prisma[table].findUnique({
                        where: tenantWhere,
                        select,
                        include
                    });
                    break;
                case 'update':
                    if (!data || !where) {
                        throw new errors_1.ActivityError('Data and where clause are required for update operation');
                    }
                    result = await database_1.prisma[table].update({
                        where: tenantWhere,
                        data,
                        select,
                        include
                    });
                    break;
                case 'delete':
                    if (!where) {
                        throw new errors_1.ActivityError('Where clause is required for delete operation');
                    }
                    result = await database_1.prisma[table].delete({
                        where: tenantWhere,
                        select,
                        include
                    });
                    break;
                case 'query':
                    const queryOptions = {
                        where: tenantWhere,
                        select,
                        include,
                        orderBy,
                        take,
                        skip
                    };
                    // Remove undefined values
                    Object.keys(queryOptions).forEach(key => {
                        if (queryOptions[key] === undefined) {
                            delete queryOptions[key];
                        }
                    });
                    result = await database_1.prisma[table].findMany(queryOptions);
                    break;
                default:
                    throw new errors_1.ActivityError(`Unsupported database operation: ${operation}`);
            }
            // Send heartbeat to indicate progress
            context.heartbeat('Database operation completed');
            return {
                success: true,
                data: result,
                operation,
                table,
                recordCount: Array.isArray(result) ? result.length : (result ? 1 : 0)
            };
        }
        catch (error) {
            console.error(`[Database Activity] Error in ${operation} on ${table}:`, error);
            if (error instanceof errors_1.ActivityError) {
                throw error;
            }
            throw new errors_1.ActivityError(`Database ${operation} operation failed: ${error instanceof Error ? error.message : String(error)}`, {
                operation,
                table,
                originalError: error
            });
        }
    }
    /**
     * Execute raw SQL query (use with caution)
     */
    async executeRawQuery(query, params = []) {
        const context = activity_1.Context.current();
        try {
            console.log('[Database Activity] Executing raw query');
            const result = await database_1.prisma.$queryRaw `${query}`;
            context.heartbeat('Raw query completed');
            return {
                success: true,
                data: result,
                rowCount: Array.isArray(result) ? result.length : 0
            };
        }
        catch (error) {
            console.error('[Database Activity] Raw query error:', error);
            throw new errors_1.ActivityError(`Raw query execution failed: ${error instanceof Error ? error.message : String(error)}`, { query, params, originalError: error });
        }
    }
    /**
     * Execute database transaction
     */
    async executeTransaction(operations) {
        const context = activity_1.Context.current();
        try {
            console.log(`[Database Activity] Executing transaction with ${operations.length} operations`);
            const results = await database_1.prisma.$transaction(async (tx) => {
                const operationResults = [];
                for (let i = 0; i < operations.length; i++) {
                    const operation = operations[i];
                    context.heartbeat(`Executing operation ${i + 1} of ${operations.length}`);
                    // Execute each operation within the transaction
                    if (!operation) {
                        throw new errors_1.ActivityError(`Operation at index ${i} is undefined.`, { index: i, operations });
                    }
                    const result = await this.executeOperationInTransaction(tx, operation);
                    operationResults.push(result);
                }
                return operationResults;
            });
            return {
                success: true,
                results,
                operationCount: operations.length
            };
        }
        catch (error) {
            console.error('[Database Activity] Transaction error:', error);
            throw new errors_1.ActivityError(`Transaction execution failed: ${error instanceof Error ? error.message : String(error)}`, { operations, originalError: error });
        }
    }
    /**
     * Execute operation within transaction context
     */
    async executeOperationInTransaction(tx, operation) {
        const { operation: op, table, data, where, select, include, tenantId } = operation;
        const tenantWhere = where ? { ...where, tenantId } : { tenantId };
        switch (op) {
            case 'create':
                return await tx[table].create({
                    data: { ...data, tenantId },
                    select,
                    include
                });
            case 'read':
                return await tx[table].findUnique({
                    where: tenantWhere,
                    select,
                    include
                });
            case 'update':
                return await tx[table].update({
                    where: tenantWhere,
                    data,
                    select,
                    include
                });
            case 'delete':
                return await tx[table].delete({
                    where: tenantWhere,
                    select,
                    include
                });
            case 'query':
                return await tx[table].findMany({
                    where: tenantWhere,
                    select,
                    include,
                    orderBy: operation.orderBy,
                    take: operation.take,
                    skip: operation.skip
                });
            default:
                throw new errors_1.ActivityError(`Unsupported transaction operation: ${op}`);
        }
    }
}
exports.DatabaseActivity = DatabaseActivity;
//# sourceMappingURL=database-activity.js.map