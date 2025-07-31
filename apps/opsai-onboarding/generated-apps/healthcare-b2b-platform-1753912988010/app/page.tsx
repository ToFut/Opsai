import { Suspense } from 'react'
import StatsOverview from '@/components/StatsOverview'
import RecentActivity from '@/components/RecentActivity'
import ChartWidget from '@/components/ChartWidget'
import ComplianceOverview from '@/components/ComplianceOverview'
import MedicalDeviceStatus from '@/components/MedicalDeviceStatus'

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Medical Device Distributor Dashboard</h1>
        <p className="text-gray-600 mt-2">Healthcare B2B distribution platform for medical devices</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsOverview />
          <ComplianceOverview />
          <MedicalDeviceStatus />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWidget />
          <RecentActivity />
        </div>
      </Suspense>
    </div>
  )
}