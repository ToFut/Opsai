'use client'

import { useEffect, useState } from 'react'

interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    // Simulate API call
    setActivities([
      {
        id: '1',
        type: 'order',
        description: 'New order #1234 received',
        timestamp: '2 minutes ago'
      },
      {
        id: '2',
        type: 'customer',
        description: 'New customer registered',
        timestamp: '5 minutes ago'
      },
      {
        id: '3',
        type: 'payment',
        description: 'Payment processed for order #1233',
        timestamp: '10 minutes ago'
      }
    ])
  }, [])

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== activities.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                        <span className="h-2 w-2 bg-white rounded-full" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {activity.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}