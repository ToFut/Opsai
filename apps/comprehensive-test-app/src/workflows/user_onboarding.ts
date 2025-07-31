import { WorkflowDefinition, workflowEngine } from './engine';

export const userOnboardingWorkflow: WorkflowDefinition = {
  id: 'user_onboarding',
  name: 'user_onboarding',
  description: 'Welcome new users and set up their environment',
  active: true,
  trigger: {
  "type": "event",
  "config": {
    "event": "user.created"
  }
},
  steps: [
  {
    "name": "send_welcome_email",
    "type": "api_call",
    "config": {
      "integration": "email_service",
      "endpoint": "send_email",
      "data": {
        "personalizations": [
          {
            "to": [
              {
                "email": "{{user.email}}",
                "name": "{{user.name}}"
              }
            ]
          }
        ],
        "from": {
          "email": "noreply@test.com",
          "name": "Test Platform"
        },
        "subject": "Welcome to Test Platform!",
        "content": [
          {
            "type": "text/html",
            "value": "<p>Welcome {{user.name}}! Get started with our platform.</p>"
          }
        ]
      }
    }
  },
  {
    "name": "notify_admin",
    "type": "webhook",
    "config": {
      "integration": "slack_notifications",
      "data": {
        "text": "New user registered: {{user.name}} ({{user.email}})",
        "channel": "#new-users"
      }
    }
  },
  {
    "name": "create_welcome_project",
    "type": "database_insert",
    "config": {
      "model": "Project",
      "data": {
        "name": "Welcome Project",
        "description": "Your first project to explore the platform",
        "organizationId": "{{user.organizationId}}",
        "ownerId": "{{user.id}}",
        "status": "active"
      }
    }
  }
]
};

// Auto-register workflow
workflowEngine.registerWorkflow(userOnboardingWorkflow);

export default userOnboardingWorkflow;