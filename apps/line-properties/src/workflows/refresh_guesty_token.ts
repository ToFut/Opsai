import { WorkflowDefinition, workflowEngine } from './engine';

export const refreshGuestyTokenWorkflow: WorkflowDefinition = {
  id: 'refresh_guesty_token',
  name: 'refresh_guesty_token',
  description: 'Refresh Guesty API token automatically',
  active: true,
  trigger: {
  "type": "schedule",
  "cron": "0 0 * * *"
},
  steps: [
  {
    "name": "fetch_new_token",
    "activity": "http_request",
    "config": {
      "integration": "guesty_api",
      "endpoint": "refresh_token",
      "data": {
        "grant_type": "client_credentials",
        "scope": "open-api"
      }
    },
    "timeout": "30s",
    "retry_policy": {
      "max_attempts": 5,
      "backoff": "exponential"
    }
  },
  {
    "name": "update_environment",
    "activity": "system_update",
    "config": {
      "variable": "GUESTY_ACCESS_TOKEN",
      "value": "{{response.access_token}}"
    }
  }
]
};

// Auto-register workflow
workflowEngine.registerWorkflow(refreshGuestyTokenWorkflow);

export default refreshGuestyTokenWorkflow;