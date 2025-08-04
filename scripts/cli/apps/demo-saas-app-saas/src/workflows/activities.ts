import { 
  BaseActivity, 
  DatabaseActivity, 
  HttpActivity, 
  NotificationActivity 
} from '@opsai/workflow';
import { prisma } from '@opsai/database';
import { integrations } from '../integrations';

// Custom activities for this application
export const customActivities = {
  // Database operations
  database_insert: new DatabaseActivity(prisma),
  database_update: new DatabaseActivity(prisma),
  database_delete: new DatabaseActivity(prisma),
  database_query: new DatabaseActivity(prisma),

  // HTTP requests
  http_request: new HttpActivity(),
  
  // Notifications
  send_email: new NotificationActivity(),
  send_sms: new NotificationActivity(),
  send_slack: new NotificationActivity(),

  // Custom business logic activities
  
};

// Activity registry for easy lookup
export const activityRegistry = new Map(Object.entries(customActivities));

// Helper function to get activity by name
export function getActivity(name: string): BaseActivity {
  const activity = activityRegistry.get(name);
  if (!activity) {
    throw new Error(`Activity '${name}' not found`);
  }
  return activity;
}
