import { BaseWorkflow } from './base-workflow';

export class SequentialWorkflow extends BaseWorkflow {
  async execute(input: any): Promise<any> {
    console.log(`Executing sequential workflow: ${this.name}`);
    // Implementation would execute steps sequentially
    return { success: true };
  }
} 