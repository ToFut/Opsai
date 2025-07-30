'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Edit } from '@heroicons/react/24/outline'

export default function GuestsDetailPage() {
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/Guest/${params.id}`)
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
          <Link href="/Guest">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Guests Details</h1>
        </div>
        <Link href={`/Guest/${params.id}/edit`}>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
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
            <dt className="font-semibold text-gray-700">name</dt>
            <dd className="mt-1 text-gray-900">
              {data.name || '-'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">email</dt>
            <dd className="mt-1 text-gray-900">
              {data.email || '-'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">phone</dt>
            <dd className="mt-1 text-gray-900">
              {data.phone || '-'}
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