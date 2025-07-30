// Auto-generated workflow exports
export { WorkflowEngine, workflowEngine } from './engine';
export { WorkflowScheduler, workflowScheduler } from './scheduler';

export { createReservationWorkflow } from './create_reservation';
export { refreshGuestyTokenWorkflow } from './refresh_guesty_token';

// Re-export all workflows as a single object
export const workflows = {
  createReservation: createReservationWorkflow,
  refreshGuestyToken: refreshGuestyTokenWorkflow
};