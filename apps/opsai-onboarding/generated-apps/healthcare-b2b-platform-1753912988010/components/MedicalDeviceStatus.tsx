import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export default function MedicalDeviceStatus() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Device Status</h3>
        <Activity className="h-5 w-5 text-blue-500" />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">Active Devices</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">1,247</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600">Pending Maintenance</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">23</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-gray-600">Critical Alerts</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">5</span>
        </div>
      </div>
    </div>
  )
} 