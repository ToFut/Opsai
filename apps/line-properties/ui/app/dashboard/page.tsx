'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/stats-card'

export default function DashboardPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch page data
    Promise.all([
      fetch('/api/user_stats').then(res => res.json()),
      fetch('/api/user_reservations').then(res => res.json()),
      fetch('/api/user_properties').then(res => res.json())
    ]).then(results => {
      setData({
        user_stats: results[0],
        user_reservations: results[1],
        user_properties: results[2]
      })
      setLoading(false)
    }).catch(error => {
      console.error('Error:', error)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(data.user_stats || []).map((stat: any, index: number) => (
                <StatsCard key={index} {...stat} />
              ))}
            </div>
      <Card className="p-6">
              <div>Component: recent_reservations</div>
            </Card>
      <Card className="p-6">
              <div>Component: property_management</div>
            </Card>
    </div>
  )
}