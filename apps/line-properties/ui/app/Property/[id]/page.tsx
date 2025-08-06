'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline'

export default function PropertiesDetailPage() {
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/Property/${params.id}`)
        .then(res => res.json())
        .then(result => {
          setData(result)
          setLoading(false)
        })
        .catch(error => {
          console.error('Error:', error)
          setLoading(false)
        })
    }
  }, [params.id])

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  if (!data) {
    return <div className="flex justify-center p-8">Not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/Property">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Properties Details</h1>
        </div>
        <Link href={`/Property/${params.id}/edit`}>
          <Button>
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <dt className="font-semibold text-gray-700">id</dt>
            <dd className="mt-1 text-gray-900">
              {data.id || '-'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">title</dt>
            <dd className="mt-1 text-gray-900">
              {data.title || '-'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">address</dt>
            <dd className="mt-1 text-gray-900">
              {data.address || '-'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">city</dt>
            <dd className="mt-1 text-gray-900">
              {data.city || '-'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">price</dt>
            <dd className="mt-1 text-gray-900">
              {data.price || '-'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">bedrooms</dt>
            <dd className="mt-1 text-gray-900">
              {data.bedrooms || '-'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">bathrooms</dt>
            <dd className="mt-1 text-gray-900">
              {data.bathrooms || '-'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">amenities</dt>
            <dd className="mt-1 text-gray-900">
              {data.amenities || '-'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">images</dt>
            <dd className="mt-1 text-gray-900">
              {data.images || '-'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">status</dt>
            <dd className="mt-1 text-gray-900">
              {data.status || '-'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">createdAt</dt>
            <dd className="mt-1 text-gray-900">
              {data.createdAt || '-'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">updatedAt</dt>
            <dd className="mt-1 text-gray-900">
              {data.updatedAt || '-'}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}