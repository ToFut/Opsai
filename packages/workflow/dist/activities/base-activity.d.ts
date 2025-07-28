export declare abstract class BaseActivity {
    protected name: string;
    protected config: Record<string, any>;
    constructor(name: string, config?: Record<string, any>);
    /**
     * Execute the activity
     */
    abstract execute(input: any): Promise<any>;
    /**
     * Get activity name
     */
    getName(): string;
    /**
     * Get activity configuration
     */
    getConfig(): Record<string, any>;
    /**
     * Validate input
     */
    validateInput(input: any): boolean;
}
//# sourceMappingURL=base-activity.d.ts.map