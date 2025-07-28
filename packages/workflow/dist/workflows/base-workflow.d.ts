export declare abstract class BaseWorkflow {
    protected id: string;
    protected name: string;
    protected config: Record<string, any>;
    constructor(id: string, name: string, config?: Record<string, any>);
    /**
     * Execute the workflow
     */
    abstract execute(input: any): Promise<any>;
    /**
     * Get workflow ID
     */
    getId(): string;
    /**
     * Get workflow name
     */
    getName(): string;
    /**
     * Get workflow configuration
     */
    getConfig(): Record<string, any>;
}
//# sourceMappingURL=base-workflow.d.ts.map