
import { NextRequest, NextResponse } from 'next/server';
import { workflowClient } from '../../../../lib/workflow/WorkflowClient';
import { WorkflowMonitoringService } from '../../../../lib/workflow/WorkflowMonitoringService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const workflowId = searchParams.get('workflowId');

    switch (action) {
      case 'health':
        const health = await WorkflowMonitoringService.getWorkflowHealth();
        return NextResponse.json(health);

      case 'metrics':
        const timeRange = searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d' || '24h';
        const metrics = await WorkflowMonitoringService.getWorkflowMetrics(timeRange);
        return NextResponse.json(metrics);

      case 'active':
        const activeWorkflows = await WorkflowMonitoringService.getActiveWorkflows();
        return NextResponse.json(activeWorkflows);

      case 'failed':
        const limit = parseInt(searchParams.get('limit') || '10');
        const failedWorkflows = await WorkflowMonitoringService.getFailedWorkflows(limit);
        return NextResponse.json(failedWorkflows);

      case 'report':
        const report = await WorkflowMonitoringService.generateWorkflowReport();
        return NextResponse.json(report);

      case 'status':
        if (!workflowId) {
          return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
        }
        const status = await workflowClient.getWorkflowStatus(workflowId);
        return NextResponse.json({ workflowId, status });

      case 'schedules':
        const schedules = await workflowClient.listSchedules();
        return NextResponse.json(schedules);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Workflow API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workflowName, workflowId, input = {} } = body;

    switch (action) {
      case 'start':
        if (!workflowName) {
          return NextResponse.json({ error: 'workflowName required' }, { status: 400 });
        }

        let result;
        switch (workflowName) {

          case 'user-onboarding':
            result = await workflowClient.startUser-onboarding(input, { workflowId });
            break;
          case 'data_quality_audit':
            result = await workflowClient.startDataQualityAudit(input, { workflowId });
            break;
          case 'generate_analytics_report':
            result = await workflowClient.startGenerateAnalyticsReport(input, { workflowId });
            break;
          case 'system_health_check':
            result = await workflowClient.startSystemHealthCheck(input, { workflowId });
            break;
          default:
            return NextResponse.json({ error: 'Unknown workflow' }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          workflowId: result.workflowId,
          runId: result.firstExecutionRunId
        });

      case 'execute':
        if (!workflowName) {
          return NextResponse.json({ error: 'workflowName required' }, { status: 400 });
        }

        let executeResult;
        switch (workflowName) {

          case 'user-onboarding':
            executeResult = await workflowClient.executeUser-onboarding(input, { workflowId });
            break;
          case 'data_quality_audit':
            executeResult = await workflowClient.executeDataQualityAudit(input, { workflowId });
            break;
          case 'generate_analytics_report':
            executeResult = await workflowClient.executeGenerateAnalyticsReport(input, { workflowId });
            break;
          case 'system_health_check':
            executeResult = await workflowClient.executeSystemHealthCheck(input, { workflowId });
            break;
          default:
            return NextResponse.json({ error: 'Unknown workflow' }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          result: executeResult
        });

      case 'cancel':
        if (!workflowId) {
          return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
        }
        await workflowClient.cancelWorkflow(workflowId);
        return NextResponse.json({ success: true, message: 'Workflow cancelled' });

      case 'terminate':
        if (!workflowId) {
          return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
        }
        await workflowClient.terminateWorkflow(workflowId, body.reason);
        return NextResponse.json({ success: true, message: 'Workflow terminated' });

      case 'pause':
        if (!workflowId) {
          return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
        }
        await workflowClient.pauseWorkflow(workflowId);
        return NextResponse.json({ success: true, message: 'Workflow paused' });

      case 'resume':
        if (!workflowId) {
          return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
        }
        await workflowClient.resumeWorkflow(workflowId);
        return NextResponse.json({ success: true, message: 'Workflow resumed' });

      case 'retry':
        if (!workflowId) {
          return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
        }
        const retryResult = await WorkflowMonitoringService.retryFailedWorkflow(workflowId);
        return NextResponse.json(retryResult);

      case 'setup_schedules':
        await workflowClient.startScheduledWorkflows();
        return NextResponse.json({ success: true, message: 'Schedules created' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Workflow API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
