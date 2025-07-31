import { WorkflowDefinition, workflowEngine } from './engine';

export const projectCompletionWorkflow: WorkflowDefinition = {
  id: 'project_completion',
  name: 'project_completion',
  description: 'Handle project completion workflow',
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
        "status": "completed"
      }
    }
  },
  {
    "name": "notify_team",
    "type": "api_call",
    "config": {
      "integration": "email_service",
      "endpoint": "send_email",
      "template": "project_completion"
    }
  }
]
};

// Auto-register workflow
workflowEngine.registerWorkflow(projectCompletionWorkflow);

export default projectCompletionWorkflow;