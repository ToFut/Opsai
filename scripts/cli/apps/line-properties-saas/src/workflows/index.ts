// Auto-generated workflow exports
export { WorkflowEngine, workflowEngine } from './engine';
export { WorkflowScheduler, workflowScheduler } from './scheduler';

export { createReservationWorkflow } from './create-reservation';
export { refreshGuestyTokenWorkflow } from './refresh-guesty-token';

// Re-export all workflows as a single object
export const workflows = {
  createReservation: createReservationWorkflow,
  refreshGuestyToken: refreshGuestyTokenWorkflow
};