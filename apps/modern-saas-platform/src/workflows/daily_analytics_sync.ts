import { WorkflowDefinition, workflowEngine } from './engine';

export const dailyAnalyticsSyncWorkflow: WorkflowDefinition = {
  id: 'daily_analytics_sync',
  name: 'daily_analytics_sync',
  description: 'Sync analytics data daily',
  active: true,
  trigger: {
  "type": "schedule",
  "cron": "0 2 * * *"
},
  steps: [
  {
    "name": "export_data",
    "type": "database_query",
    "config": {
      "query": "SELECT * FROM projects \nWHERE updatedAt >= NOW() - INTERVAL '1 day'\n"
    }
  },
  {
    "name": "transform_data",
    "type": "transformation",
    "config": {
      "rules": [
        {
          "type": "aggregate",
          "groupBy": [
            "organizationId",
            "status"
          ],
          "metrics": [
            {
              "count": "id"
            },
            {
              "sum": "budget"
            }
          ]
        }
      ]
    }
  },
  {
    "name": "sync_to_analytics",
    "type": "api_call",
    "config": {
      "integration": "analytics_db",
      "endpoint": "bulk_insert",
      "data": "{{transformedData}}"
    }
  }
]
};

// Auto-register workflow
workflowEngine.registerWorkflow(dailyAnalyticsSyncWorkflow);

export default dailyAnalyticsSyncWorkflow;