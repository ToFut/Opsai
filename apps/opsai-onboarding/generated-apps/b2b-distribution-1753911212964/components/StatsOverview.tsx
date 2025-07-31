'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react'

interface Stats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  conversionRate: number
}

export default function StatsOverview() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    conversionRate: 0
  })

  useEffect(() => {
    // Simulate API call
    setStats({
      totalRevenue: 45231.89,
      totalOrders: 1240,
      totalCustomers: 892,
      conversionRate: 3.2
    })
  }, [])

  const statItems = [
    {
      name: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: '+20.1%',
      changeType: 'positive'
    },
    {
      name: 'Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      change: '+15.3%',
      changeType: 'positive'
    },
    {
      name: 'Customers',
      value: stats.totalCustomers.toLocaleString(),
      icon: Users,
      change: '+12.5%',
      changeType: 'positive'
    },
    {
      name: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      change: '+2.1%',
      changeType: 'positive'
    }
  ]

  return (
    <>
      {statItems.map((item) => (
        <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <item.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{item.value}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {item.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}