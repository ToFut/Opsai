'use client'

import { useEffect, useState } from 'react'

export default function ChartWidget() {
  const [chartData, setChartData] = useState([])

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Analytics Overview
        </h3>
        <div className="mt-5">
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Chart visualization will be implemented here</p>
          </div>
        </div>
      </div>
    </div>
  )
}