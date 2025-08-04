import { Home, Settings, BarChart3 } from 'lucide-react'

export default function Sidebar() {
  return (
    <div className="bg-white w-64 min-h-screen shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold">Dashboard</h2>
      </div>
      
      <nav className="mt-6">
        <div className="px-6 py-3">
          <a href="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Home className="h-5 w-5" />
            <span className="ml-3">Overview</span>
          </a>
          
        <a href="/dashboard/entities" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <span className="ml-3">entities</span>
        </a>
        <a href="/dashboard/relationships" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <span className="ml-3">relationships</span>
        </a>
        <a href="/dashboard/indexes" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <span className="ml-3">indexes</span>
        </a>
        <a href="/dashboard/views" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <span className="ml-3">views</span>
        </a>
          
          <a href="/analytics" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <BarChart3 className="h-5 w-5" />
            <span className="ml-3">Analytics</span>
          </a>
          
          <a href="/settings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Settings className="h-5 w-5" />
            <span className="ml-3">Settings</span>
          </a>
        </div>
      </nav>
    </div>
  )
}