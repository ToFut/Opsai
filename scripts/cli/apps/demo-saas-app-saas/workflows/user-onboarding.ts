
import { proxyActivities, defineQuery, defineSignal, setHandler, condition } from '@temporalio/workflow';
import type { WorkflowActivities } from '../activities/workflow-activities';

const activities = proxyActivities<WorkflowActivities>({
  startToCloseTimeout: '300000ms',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
  },
});

// Queries and signals for workflow interaction
export const getWorkflowStatusQuery = defineQuery<string>('getWorkflowStatus');
export const pauseWorkflowSignal = defineSignal<void>('pauseWorkflow');
export const resumeWorkflowSignal = defineSignal<void>('resumeWorkflow');
export const cancelWorkflowSignal = defineSignal<void>('cancelWorkflow');

interface User-onboardingInput {
  entityId?: string;
  data?: any;
  metadata?: any;
}

export async function user-onboarding(input: User-onboardingInput): Promise<any> {
  let workflowStatus = 'running';
  let isPaused = false;
  let isCancelled = false;

  // Set up query and signal handlers
  setHandler(getWorkflowStatusQuery, () => workflowStatus);
  
  setHandler(pauseWorkflowSignal, () => {
    isPaused = true;
    workflowStatus = 'paused';
  });
  
  setHandler(resumeWorkflowSignal, () => {
    isPaused = false;
    workflowStatus = 'running';
  });
  
  setHandler(cancelWorkflowSignal, () => {
    isCancelled = true;
    workflowStatus = 'cancelled';
  });

  try {
    console.log('Starting workflow: user-onboarding', input);
    

    // Step 1: send-welcome-email
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'send-welcome-email' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'send-welcome-email' };
    }
    
    console.log('Executing step: send-welcome-email');
    const step1Result = await activities.executeGenericStep({
      stepName: 'send-welcome-email',
      stepType: 'api-call',
      config: {"integration":"email-service","endpoint":"send-email","template":"welcome-email"},
      input: input,
      previousResult: null
    });
    
    if (!step1Result.success) {
      console.error('Step send-welcome-email failed:', step1Result.error);
      throw new Error(`Step ${step.name} failed: ${step${index + 1}Result.error}`);
    }

    
    workflowStatus = 'completed';
    console.log('Workflow user-onboarding completed successfully');
    
    return {
      status: 'completed',
      workflowName: 'user-onboarding',
      input: input,
      results: {
        step1: step1Result
      }
    };
    
  } catch (error) {
    workflowStatus = 'failed';
    console.error('Workflow user-onboarding failed:', error);
    
    // Log workflow failure
    await activities.logWorkflowEvent({
      workflowName: 'user-onboarding',
      eventType: 'workflow_failed',
      error: error.message,
      input: input
    });
    
    throw error;
  }
}
