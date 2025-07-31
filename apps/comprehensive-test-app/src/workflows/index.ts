// Auto-generated workflow exports
export { WorkflowEngine, workflowEngine } from './engine';
export { WorkflowScheduler, workflowScheduler } from './scheduler';

export { userOnboardingWorkflow } from './user_onboarding';
export { projectCompletionWorkflow } from './project_completion';

// Re-export all workflows as a single object
export const workflows = {
  userOnboarding: userOnboardingWorkflow,
  projectCompletion: projectCompletionWorkflow
};