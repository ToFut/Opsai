'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface EntityFormProps {
  onSubmit: (data: any) => void
  loading?: boolean
  defaultValues?: Record<string, any>
}

export function EntityForm({ onSubmit, loading, defaultValues }: EntityFormProps) {
  const form = useForm({ defaultValues })
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Properties Form</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">id</label>
        <input
          {...form.register('id')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">title</label>
        <input
          {...form.register('title')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">address</label>
        <input
          {...form.register('address')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">city</label>
        <input
          {...form.register('city')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">price</label>
        <input
          {...form.register('price')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">bedrooms</label>
        <input
          {...form.register('bedrooms')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">bathrooms</label>
        <input
          {...form.register('bathrooms')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">amenities</label>
        <input
          {...form.register('amenities')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">images</label>
        <input
          {...form.register('images')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">status</label>
        <input
          {...form.register('status')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">createdAt</label>
        <input
          {...form.register('createdAt')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">updatedAt</label>
        <input
          {...form.register('updatedAt')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Properties'}
      </button>
    </form>
  )
}