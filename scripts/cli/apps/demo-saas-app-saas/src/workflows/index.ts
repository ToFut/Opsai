// Auto-generated workflow exports
export { WorkflowEngine, workflowEngine } from './engine';
export { WorkflowScheduler, workflowScheduler } from './scheduler';

export { userOnboardingWorkflow } from './user-onboarding';

// Re-export all workflows as a single object
export const workflows = {
  userOnboarding: userOnboardingWorkflow
};