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
      <h2 className="text-xl font-semibold mb-4">Guests Form</h2>
      
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
        <label className="block text-sm font-medium mb-2">name</label>
        <input
          {...form.register('name')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">email</label>
        <input
          {...form.register('email')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder=""
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">phone</label>
        <input
          {...form.register('phone')}
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
        {loading ? 'Saving...' : 'Save Guests'}
      </button>
    </form>
  )
}