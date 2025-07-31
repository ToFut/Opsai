import { WorkflowDefinition, workflowEngine } from './engine';

export const projectCompletionWorkflow: WorkflowDefinition = {
  id: 'project_completion',
  name: 'project_completion',
  description: 'Handle project completion',
  active: true,
  trigger: {
  "type": "api_call",
  "endpoint": "/api/projects/{id}/complete",
  "method": "POST"
},
  steps: [
  {
    "name": "update_project_status",
    "type": "database_update",
    "config": {
      "model": "Project",
      "where": "id = {{projectId}}",
      "data": {
        "status": "completed",
        "completedAt": "{{now()}}"
      }
    }
  },
  {
    "name": "calculate_metrics",
    "type": "custom",
    "config": {
      "function": "calculateProjectMetrics",
      "params": {
        "projectId": "{{projectId}}"
      }
    }
  },
  {
    "name": "send_completion_report",
    "type": "api_call",
    "config": {
      "integration": "sendgrid_email",
      "endpoint": "send_email",
      "template": "project_completion_report"
    }
  },
  {
    "name": "archive_data",
    "type": "api_call",
    "config": {
      "integration": "analytics_db",
      "endpoint": "archive_project",
      "data": {
        "projectId": "{{projectId}}",
        "metrics": "{{metrics}}"
      }
    }
  }
]
};

// Auto-register workflow
workflowEngine.registerWorkflow(projectCompletionWorkflow);

export default projectCompletionWorkflow;