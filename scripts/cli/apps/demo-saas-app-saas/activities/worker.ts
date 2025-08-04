
import { Worker } from '@temporalio/worker';
import { WorkflowActivities } from './workflow-activities';
import * as workflows from '../workflows';

async function runWorker() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('../workflows'),
    activities: WorkflowActivities,
    taskQueue: 'default',
    // Configure worker options
    maxConcurrentActivityTaskExecutions: 10,
    maxConcurrentWorkflowTaskExecutions: 10,
  });

  console.log('🚀 Temporal worker started');
  await worker.run();
}

runWorker().catch((err) => {
  console.error('❌ Worker failed:', err);
  process.exit(1);
});
