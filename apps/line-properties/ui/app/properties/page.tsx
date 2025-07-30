'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'


export default function PropertiesPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch page data
    Promise.all([
      Promise.resolve({}),
      fetch('/api/properties').then(res => res.json())
    ]).then(results => {
      setData({
        component0: results[0],
        properties: results[1]
      })
      setLoading(false)
    }).catch(error => {
      console.error('Error:', error)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">properties</h1>
      
      <Card className="p-6">
              <div>Component: filter_bar</div>
            </Card>
      <Card className="p-6">
              <div>Component: property_grid</div>
            </Card>
    </div>
  )
}