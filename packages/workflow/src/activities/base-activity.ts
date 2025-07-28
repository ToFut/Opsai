export abstract class BaseActivity {
  protected name: string;
  protected config: Record<string, any>;

  constructor(name: string, config: Record<string, any> = {}) {
    this.name = name;
    this.config = config;
  }

  /**
   * Execute the activity
   */
  abstract execute(input: any): Promise<any>;

  /**
   * Get activity name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get activity configuration
   */
  getConfig(): Record<string, any> {
    return this.config;
  }

  /**
   * Validate input
   */
  validateInput(input: any): boolean {
    console.log(`Validating input for activity: ${this.name}`);
    return true;
  }
} 