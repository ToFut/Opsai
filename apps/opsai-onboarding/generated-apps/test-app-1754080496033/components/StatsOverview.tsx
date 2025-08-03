'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, Activity, DollarSign } from 'lucide-react'

export default function StatsOverview() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalOrders: 0,
    growthRate: 0
  })

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TrendingUp className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Growth Rate
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {stats.growthRate}%
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}