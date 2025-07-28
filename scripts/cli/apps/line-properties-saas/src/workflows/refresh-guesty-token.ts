import { WorkflowDefinition, workflowEngine } from './engine';

export const refreshGuestyTokenWorkflow: WorkflowDefinition = {
  id: 'refresh-guesty-token',
  name: 'Refresh Guesty API Token',
  description: 'Automatically refresh Guesty API authentication token',
  active: true,
  trigger: {
  "type": "schedule",
  "config": {
    "cron": "0 0 * * *"
  }
},
  steps: [
  {
    "name": "fetch-new-token",
    "type": "api-call",
    "config": {
      "integration": "guesty-api",
      "endpoint": "refresh-token"
    }
  },
  {
    "name": "update-environment",
    "type": "system-update",
    "config": {
      "variable": "GUESTY_ACCESS_TOKEN"
    }
  }
]
};

// Auto-register workflow
workflowEngine.registerWorkflow(refreshGuestyTokenWorkflow);

export default refreshGuestyTokenWorkflow;