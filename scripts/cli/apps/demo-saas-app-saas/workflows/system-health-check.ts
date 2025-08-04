
import { proxyActivities, defineQuery, defineSignal, setHandler, condition } from '@temporalio/workflow';
import type { WorkflowActivities } from '../activities/workflow-activities';

const activities = proxyActivities<WorkflowActivities>({
  startToCloseTimeout: '120000ms',
  retry: {
    maximumAttempts: 2,
    backoffCoefficient: 1.5,
  },
});

// Queries and signals for workflow interaction
export const getWorkflowStatusQuery = defineQuery<string>('getWorkflowStatus');
export const pauseWorkflowSignal = defineSignal<void>('pauseWorkflow');
export const resumeWorkflowSignal = defineSignal<void>('resumeWorkflow');
export const cancelWorkflowSignal = defineSignal<void>('cancelWorkflow');

interface SystemHealthCheckInput {
  entityId?: string;
  data?: any;
  metadata?: any;
}

export async function systemHealthCheck(input: SystemHealthCheckInput): Promise<any> {
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
    console.log('Starting workflow: system_health_check', input);
    

    // Step 1: check_database_health
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'check_database_health' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'check_database_health' };
    }
    
    console.log('Executing step: check_database_health');
    const step1Result = await activities.performDatabaseOperation({
      stepName: 'check_database_health',
      stepType: 'database_operation',
      config: {"action":"health_check"},
      input: input,
      previousResult: null
    });
    
    if (!step1Result.success) {
      console.error('Step check_database_health failed:', step1Result.error);
      
    }

    // Step 2: check_api_endpoints
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'check_api_endpoints' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'check_api_endpoints' };
    }
    
    console.log('Executing step: check_api_endpoints');
    const step2Result = await activities.makeApiCall({
      stepName: 'check_api_endpoints',
      stepType: 'api_call',
      config: {"service":"health_monitor","endpoint":"/health","method":"GET"},
      input: input,
      previousResult: step1Result
    });
    
    if (!step2Result.success) {
      console.error('Step check_api_endpoints failed:', step2Result.error);
      
    }

    // Step 3: check_integration_status
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'check_integration_status' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'check_integration_status' };
    }
    
    console.log('Executing step: check_integration_status');
    const step3Result = await activities.executeParallel({
      stepName: 'check_integration_status',
      stepType: 'parallel',
      config: {"steps":[]},
      input: input,
      previousResult: step2Result
    });
    
    if (!step3Result.success) {
      console.error('Step check_integration_status failed:', step3Result.error);
      
    }

    // Step 4: alert_on_issues
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'alert_on_issues' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'alert_on_issues' };
    }
    
    console.log('Executing step: alert_on_issues');
    const step4Result = await activities.evaluateCondition({
      stepName: 'alert_on_issues',
      stepType: 'conditional',
      config: {"condition":"any_health_check_failed","then":{"type":"notification","config":{"channels":["slack","email"],"severity":"high"}}},
      input: input,
      previousResult: step3Result
    });
    
    if (!step4Result.success) {
      console.error('Step alert_on_issues failed:', step4Result.error);
      
    }

    
    workflowStatus = 'completed';
    console.log('Workflow system_health_check completed successfully');
    
    return {
      status: 'completed',
      workflowName: 'system_health_check',
      input: input,
      results: {
        step1: step1Result,
        step2: step2Result,
        step3: step3Result,
        step4: step4Result
      }
    };
    
  } catch (error) {
    workflowStatus = 'failed';
    console.error('Workflow system_health_check failed:', error);
    
    // Log workflow failure
    await activities.logWorkflowEvent({
      workflowName: 'system_health_check',
      eventType: 'workflow_failed',
      error: error.message,
      input: input
    });
    
    throw error;
  }
}
