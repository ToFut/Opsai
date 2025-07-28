import { BaseActivity } from './base-activity';
interface DatabaseActivityInput {
    operation: 'create' | 'read' | 'update' | 'delete' | 'query';
    table: string;
    data?: any;
    where?: any;
    select?: any;
    include?: any;
    orderBy?: any;
    take?: number;
    skip?: number;
    tenantId: string;
}
export declare class DatabaseActivity extends BaseActivity {
    execute(input: DatabaseActivityInput): Promise<any>;
    /**
     * Execute raw SQL query (use with caution)
     */
    executeRawQuery(query: string, params?: any[]): Promise<any>;
    /**
     * Execute database transaction
     */
    executeTransaction(operations: DatabaseActivityInput[]): Promise<any>;
    /**
     * Execute operation within transaction context
     */
    private executeOperationInTransaction;
}
export {};
//# sourceMappingURL=database-activity.d.ts.map