import { WorkflowDefinition, workflowEngine } from './engine';

export const createReservationWorkflow: WorkflowDefinition = {
  id: 'create_reservation',
  name: 'create_reservation',
  description: 'Create a new property reservation with validation',
  active: true,
  trigger: {
  "type": "api_call",
  "endpoint": "/api/reservations",
  "method": "POST"
},
  steps: [
  {
    "name": "validate_availability",
    "activity": "database_query",
    "config": {
      "model": "Reservation",
      "where": "propertyId = {{propertyId}} AND status = 'confirmed' AND ((checkIn <= {{checkIn}} AND checkOut > {{checkIn}}) OR (checkIn < {{checkOut}} AND checkOut >= {{checkOut}}))"
    },
    "timeout": "30s",
    "retry_policy": {
      "max_attempts": 3,
      "backoff": "exponential"
    }
  },
  {
    "name": "create_reservation",
    "activity": "database_insert",
    "config": {
      "model": "Reservation",
      "data": {
        "propertyId": "{{propertyId}}",
        "guestId": "{{guestId}}",
        "checkIn": "{{checkIn}}",
        "checkOut": "{{checkOut}}",
        "totalPrice": "{{totalPrice}}",
        "status": "pending"
      }
    }
  },
  {
    "name": "send_confirmation_email",
    "activity": "http_request",
    "config": {
      "integration": "email_service",
      "endpoint": "send_email",
      "data": {
        "to": "{{guest.email}}",
        "subject": "Reservation Confirmation",
        "template": "reservation_created"
      }
    },
    "timeout": "60s"
  },
  {
    "name": "update_property_status",
    "activity": "database_update",
    "config": {
      "model": "Property",
      "where": "id = {{propertyId}}",
      "data": {
        "status": "booked"
      }
    }
  }
]
};

// Auto-register workflow
workflowEngine.registerWorkflow(createReservationWorkflow);

export default createReservationWorkflow;