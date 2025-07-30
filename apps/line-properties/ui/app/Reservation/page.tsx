'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Reservation {
  id: string
  propertyId: string
  guestId: string
  checkIn: string
  checkOut: string
  totalPrice: number
  status: string
  createdAt: string
  updatedAt: string
}

export default function ReservationsPage() {
  const [data, setData] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for now since API might not be connected
    const mockData = [
      {
        id: '1',
        propertyId: '1',
        guestId: '1',
        checkIn: '2024-01-15',
        checkOut: '2024-01-20',
        totalPrice: 1250,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        propertyId: '2',
        guestId: '2',
        checkIn: '2024-02-10',
        checkOut: '2024-02-15',
        totalPrice: 1500,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    setData(mockData)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading reservations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reservations</h1>
        <Link href="/Reservation/new">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
            <span className="mr-2">+</span>
            Add Reservation
          </button>
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reservation.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reservation.propertyId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reservation.guestId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(reservation.checkIn).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(reservation.checkOut).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${reservation.totalPrice.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      reservation.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : reservation.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {reservation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link href={`/Reservation/${reservation.id}`}>
                        <button className="text-blue-600 hover:text-blue-900 px-3 py-1 border border-blue-300 rounded text-sm">
                          View
                        </button>
                      </Link>
                      <Link href={`/Reservation/${reservation.id}/edit`}>
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
            <div className="text-gray-500">No reservations found</div>
            <Link href="/Reservation/new">
              <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                Create First Reservation
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}