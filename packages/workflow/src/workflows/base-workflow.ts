export abstract class BaseWorkflow {
  protected id: string;
  protected name: string;
  protected config: Record<string, any>;

  constructor(id: string, name: string, config: Record<string, any> = {}) {
    this.id = id;
    this.name = name;
    this.config = config;
  }

  /**
   * Execute the workflow
   */
  abstract execute(input: any): Promise<any>;

  /**
   * Get workflow ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get workflow name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get workflow configuration
   */
  getConfig(): Record<string, any> {
    return this.config;
  }
} 