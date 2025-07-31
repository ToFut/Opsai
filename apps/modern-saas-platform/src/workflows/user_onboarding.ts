import { WorkflowDefinition, workflowEngine } from './engine';

export const userOnboardingWorkflow: WorkflowDefinition = {
  id: 'user_onboarding',
  name: 'user_onboarding',
  description: 'Complete user onboarding process',
  active: true,
  trigger: {
  "type": "event",
  "config": {
    "event": "user.created"
  }
},
  steps: [
  {
    "name": "create_stripe_customer",
    "type": "api_call",
    "config": {
      "integration": "stripe_payments",
      "endpoint": "create_customer",
      "data": {
        "email": "{{user.email}}",
        "name": "{{user.name}}",
        "metadata": {
          "userId": "{{user.id}}",
          "organizationId": "{{user.organizationId}}"
        }
      }
    },
    "retry": {
      "attempts": 3,
      "delay": 5000
    }
  },
  {
    "name": "send_welcome_email",
    "type": "api_call",
    "config": {
      "integration": "sendgrid_email",
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
          "email": "noreply@techcorp.com",
          "name": "TechCorp Platform"
        },
        "subject": "Welcome to TechCorp Platform!",
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
    "name": "notify_slack",
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
    "name": "create_default_project",
    "type": "database_insert",
    "config": {
      "model": "Project",
      "data": {
        "name": "Getting Started",
        "description": "Your first project to explore the platform",
        "organizationId": "{{user.organizationId}}",
        "createdBy": "{{user.id}}",
        "status": "active"
      }
    }
  }
]
};

// Auto-register workflow
workflowEngine.registerWorkflow(userOnboardingWorkflow);

export default userOnboardingWorkflow;