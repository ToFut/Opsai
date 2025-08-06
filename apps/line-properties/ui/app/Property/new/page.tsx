'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EntityForm } from '@/components/forms/Property-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function CreatePropertiesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/Property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('Properties created successfully')
        router.push('/Property')
      } else {
        toast.error('Failed to create Property')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/Property">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create Properties</h1>
      </div>

      <Card className="p-6">
        <EntityForm 
          onSubmit={handleSubmit}
          loading={loading}
        />
      </Card>
    </div>
  )
}