import { WorkflowDefinition, workflowEngine } from './engine';

export const createReservationWorkflow: WorkflowDefinition = {
  id: 'create-reservation',
  name: 'Create Reservation',
  description: 'Handle new property reservation with availability check and confirmation',
  active: true,
  trigger: {
  "type": "event",
  "config": {
    "event": "reservation.created"
  }
},
  steps: [
  {
    "name": "validate-availability",
    "type": "database-query",
    "config": {
      "query": "Check property availability for dates",
      "entity": "reservation"
    }
  },
  {
    "name": "update-property-status",
    "type": "database-update",
    "config": {
      "entity": "property",
      "field": "status",
      "value": "booked"
    }
  },
  {
    "name": "send-confirmation-email",
    "type": "api-call",
    "config": {
      "integration": "email-service",
      "endpoint": "send-confirmation"
    }
  }
]
};

// Auto-register workflow
workflowEngine.registerWorkflow(createReservationWorkflow);

export default createReservationWorkflow;