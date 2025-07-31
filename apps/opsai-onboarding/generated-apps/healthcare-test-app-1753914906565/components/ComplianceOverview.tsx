'use client'

import { useEffect, useState } from 'react'
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react'

export default function ComplianceOverview() {
  const [complianceData, setComplianceData] = useState({
    totalDevices: 0,
    compliantDevices: 0,
    pendingCertifications: 0,
    expiredCertifications: 0
  })

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Shield className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Compliance Status
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {complianceData.compliantDevices}/{complianceData.totalDevices} Devices
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span className="text-red-600 font-medium">{complianceData.expiredCertifications} Expired</span>
          <span className="mx-2">•</span>
          <span className="text-yellow-600 font-medium">{complianceData.pendingCertifications} Pending</span>
        </div>
      </div>
    </div>
  )
}