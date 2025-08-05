import { Suspense } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        undefined Dashboard
      </h1>
      
      <Suspense fallback={<div>Loading stats...</div>}>
        <StatsCards />
      </Suspense>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Suspense fallback={<div>Loading chart...</div>}>
          <RevenueChart />
        </Suspense>
        
        <Suspense fallback={<div>Loading activity...</div>}>
          <RecentActivity />
        </Suspense>
      </div>
      
      <div className="mt-8">
        <QuickActions />
      </div>
    </div>
  )
}
