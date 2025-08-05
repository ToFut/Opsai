'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, ShoppingCart } from 'lucide-react'

export default function SalesOverview() {
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    conversionRate: 0
  })

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <DollarSign className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Revenue
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                $0
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span className="text-green-600 font-medium">0 Orders</span>
          <span className="mx-2">•</span>
          <span className="text-blue-600 font-medium">$0 Avg Order</span>
        </div>
      </div>
    </div>
  )
}