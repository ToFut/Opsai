
import { proxyActivities, defineQuery, defineSignal, setHandler, condition } from '@temporalio/workflow';
import type { WorkflowActivities } from '../activities/workflow-activities';

const activities = proxyActivities<WorkflowActivities>({
  startToCloseTimeout: '600000ms',
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

interface DataQualityAuditInput {
  entityId?: string;
  data?: any;
  metadata?: any;
}

export async function dataQualityAudit(input: DataQualityAuditInput): Promise<any> {
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
    console.log('Starting workflow: data_quality_audit', input);
    

    // Step 1: check_data_completeness
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'check_data_completeness' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'check_data_completeness' };
    }
    
    console.log('Executing step: check_data_completeness');
    const step1Result = await activities.validateData({
      stepName: 'check_data_completeness',
      stepType: 'data_validation',
      config: {"checkType":"completeness"},
      input: input,
      previousResult: null
    });
    
    if (!step1Result.success) {
      console.error('Step check_data_completeness failed:', step1Result.error);
      
    }

    // Step 2: check_data_consistency
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'check_data_consistency' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'check_data_consistency' };
    }
    
    console.log('Executing step: check_data_consistency');
    const step2Result = await activities.validateData({
      stepName: 'check_data_consistency',
      stepType: 'data_validation',
      config: {"checkType":"consistency"},
      input: input,
      previousResult: step1Result
    });
    
    if (!step2Result.success) {
      console.error('Step check_data_consistency failed:', step2Result.error);
      
    }

    // Step 3: generate_quality_report
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'generate_quality_report' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'generate_quality_report' };
    }
    
    console.log('Executing step: generate_quality_report');
    const step3Result = await activities.performCalculation({
      stepName: 'generate_quality_report',
      stepType: 'calculation',
      config: {"operation":"aggregate_quality_metrics"},
      input: input,
      previousResult: step2Result
    });
    
    if (!step3Result.success) {
      console.error('Step generate_quality_report failed:', step3Result.error);
      
    }

    // Step 4: send_quality_alert
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'send_quality_alert' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'send_quality_alert' };
    }
    
    console.log('Executing step: send_quality_alert');
    const step4Result = await activities.sendNotification({
      stepName: 'send_quality_alert',
      stepType: 'notification',
      config: {"condition":"quality_score < 80","channels":["email","slack"],"severity":"medium"},
      input: input,
      previousResult: step3Result
    });
    
    if (!step4Result.success) {
      console.error('Step send_quality_alert failed:', step4Result.error);
      
    }

    
    workflowStatus = 'completed';
    console.log('Workflow data_quality_audit completed successfully');
    
    return {
      status: 'completed',
      workflowName: 'data_quality_audit',
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
    console.error('Workflow data_quality_audit failed:', error);
    
    // Log workflow failure
    await activities.logWorkflowEvent({
      workflowName: 'data_quality_audit',
      eventType: 'workflow_failed',
      error: error.message,
      input: input
    });
    
    throw error;
  }
}
