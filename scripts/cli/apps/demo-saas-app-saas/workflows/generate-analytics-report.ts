
import { proxyActivities, defineQuery, defineSignal, setHandler, condition } from '@temporalio/workflow';
import type { WorkflowActivities } from '../activities/workflow-activities';

const activities = proxyActivities<WorkflowActivities>({
  startToCloseTimeout: '900000ms',
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

interface GenerateAnalyticsReportInput {
  entityId?: string;
  data?: any;
  metadata?: any;
}

export async function generateAnalyticsReport(input: GenerateAnalyticsReportInput): Promise<any> {
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
    console.log('Starting workflow: generate_analytics_report', input);
    

    // Step 1: collect_metrics
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'collect_metrics' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'collect_metrics' };
    }
    
    console.log('Executing step: collect_metrics');
    const step1Result = await activities.performDatabaseOperation({
      stepName: 'collect_metrics',
      stepType: 'database_operation',
      config: {"action":"aggregate","tables":["analytics_events","business_metrics"]},
      input: input,
      previousResult: null
    });
    
    if (!step1Result.success) {
      console.error('Step collect_metrics failed:', step1Result.error);
      
    }

    // Step 2: generate_insights
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'generate_insights' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'generate_insights' };
    }
    
    console.log('Executing step: generate_insights');
    const step2Result = await activities.performCalculation({
      stepName: 'generate_insights',
      stepType: 'calculation',
      config: {"operation":"business_intelligence_analysis"},
      input: input,
      previousResult: step1Result
    });
    
    if (!step2Result.success) {
      console.error('Step generate_insights failed:', step2Result.error);
      
    }

    // Step 3: create_report
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'create_report' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'create_report' };
    }
    
    console.log('Executing step: create_report');
    const step3Result = await activities.makeApiCall({
      stepName: 'create_report',
      stepType: 'api_call',
      config: {"service":"report_generator","endpoint":"/generate","method":"POST"},
      input: input,
      previousResult: step2Result
    });
    
    if (!step3Result.success) {
      console.error('Step create_report failed:', step3Result.error);
      
    }

    // Step 4: distribute_report
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'distribute_report' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: 'distribute_report' };
    }
    
    console.log('Executing step: distribute_report');
    const step4Result = await activities.sendNotification({
      stepName: 'distribute_report',
      stepType: 'notification',
      config: {"channels":["email"],"recipients":["admin","stakeholders"]},
      input: input,
      previousResult: step3Result
    });
    
    if (!step4Result.success) {
      console.error('Step distribute_report failed:', step4Result.error);
      
    }

    
    workflowStatus = 'completed';
    console.log('Workflow generate_analytics_report completed successfully');
    
    return {
      status: 'completed',
      workflowName: 'generate_analytics_report',
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
    console.error('Workflow generate_analytics_report failed:', error);
    
    // Log workflow failure
    await activities.logWorkflowEvent({
      workflowName: 'generate_analytics_report',
      eventType: 'workflow_failed',
      error: error.message,
      input: input
    });
    
    throw error;
  }
}
