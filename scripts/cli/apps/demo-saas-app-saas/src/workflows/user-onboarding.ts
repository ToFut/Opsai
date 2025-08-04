import { WorkflowDefinition, workflowEngine } from './engine';

export const userOnboardingWorkflow: WorkflowDefinition = {
  id: 'user-onboarding',
  name: 'user-onboarding',
  description: 'Onboard new users with welcome email',
  active: true,
  trigger: {
  "type": "event",
  "config": {
    "event": "user.created"
  }
},
  steps: [
  {
    "name": "send-welcome-email",
    "type": "api-call",
    "config": {
      "integration": "email-service",
      "endpoint": "send-email",
      "template": "welcome-email"
    },
    "retry": {
      "attempts": 3,
      "delay": 5000
    }
  }
]
};

// Auto-register workflow
workflowEngine.registerWorkflow(userOnboardingWorkflow);

export default userOnboardingWorkflow;