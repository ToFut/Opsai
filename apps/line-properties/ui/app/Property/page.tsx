'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Property {
  id: string
  title: string
  address: string
  city: string
  price: number
  bedrooms: number
  bathrooms: number
  amenities: string[]
  images: string[]
  status: string
  createdAt: string
  updatedAt: string
  source?: string // 'guesty' or 'local'
}

export default function PropertiesPage() {
  const [data, setData] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [sources, setSources] = useState({ guesty: 0, local: 0 })

  useEffect(() => {
    // Try to fetch real data from backend
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3003'}/api/properties`, {
      headers: {
        'X-Tenant': 'line-properties' // Add tenant header
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.data && result.data.length > 0) {
          setData(result.data)
          setSources(result.sources || { guesty: 0, local: result.data.length })
          console.log('✅ Loaded properties:', result.data.length, 'from API')
        } else {
          // Fallback to mock data if API fails
          const mockData = [
            {
              id: '1',
              title: '🏖️ Beautiful Beach House (DEMO)',
              address: '123 Ocean Drive',
              city: 'Miami',
              price: 250,
              bedrooms: 3,
              bathrooms: 2,
              amenities: ['WiFi', 'Pool', 'Parking'],
              images: [],
              status: 'available',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              source: 'mock'
            },
            {
              id: '2',
              title: '🏔️ Mountain Cabin Retreat (DEMO)',
              address: '456 Mountain View',
              city: 'Aspen',
              price: 180,
              bedrooms: 2,
              bathrooms: 1,
              amenities: ['Fireplace', 'Hot Tub', 'Ski Access'],
              images: [],
              status: 'available',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              source: 'mock'
            }
          ]
          setData(mockData)
          setSources({ guesty: 0, local: 0 })
          console.log('⚠️ Using mock data - API not available')
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('❌ API Error:', error)
        // Show mock data with error indicator
        const mockData = [
          {
            id: '1',
            title: '❌ API CONNECTION FAILED - DEMO DATA',
            address: 'Backend API not responding',
            city: 'Mock City',
            price: 0,
            bedrooms: 0,
            bathrooms: 0,
            amenities: ['Demo'],
            images: [],
            status: 'maintenance',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'error'
          }
        ]
        setData(mockData)
        setSources({ guesty: 0, local: 0 })
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading properties from Guesty API...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <div className="text-sm text-gray-600 mt-1">
            📊 Data Sources: {sources.guesty} from Guesty API, {sources.local} from local DB
          </div>
        </div>
        <Link href="/Property/new">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
            <span className="mr-2">+</span>
            Add Property
          </button>
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{property.title}</div>
                    <div className="text-sm text-gray-500">{property.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${property.price}/night
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.bedrooms} bed, {property.bathrooms} bath
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      property.status === 'available' 
                        ? 'bg-green-100 text-green-800'
                        : property.status === 'booked'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {property.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      property.source === 'guesty' 
                        ? 'bg-blue-100 text-blue-800'
                        : property.source === 'local'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {property.source || 'unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link href={`/Property/${property.id}`}>
                        <button className="text-blue-600 hover:text-blue-900 px-3 py-1 border border-blue-300 rounded text-sm">
                          View
                        </button>
                      </Link>
                      <Link href={`/Property/${property.id}/edit`}>
                        <button className="text-green-600 hover:text-green-900 px-3 py-1 border border-green-300 rounded text-sm">
                          Edit
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {data.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No properties found</div>
            <Link href="/Property/new">
              <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                Add First Property
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}