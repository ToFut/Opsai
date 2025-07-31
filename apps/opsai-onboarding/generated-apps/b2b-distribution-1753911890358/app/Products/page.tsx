'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Product {
  id: string
  id: string
  createdAt: string
  updatedAt: string
  productID: string
  name: string
  regulatoryStatus: string
}

export default function ProductList() {
  const [Products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/Products')
      .then(res => res.json())
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching Products:', error)
        setLoading(false)
      })
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this Product?')) {
      try {
        await fetch(`/api/Products/${id}`, { method: 'DELETE' })
        setProducts(Products.filter(item => item.id !== id))
      } catch (error) {
        console.error('Error deleting Product:', error)
      }
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your Products
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/Products/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-my-2 -mx-6 overflow-x-auto lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Id
                      </th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        CreatedAt
                      </th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        ProductID
                      </th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Name
                      </th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        RegulatoryStatus
                      </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {Products.map((Product) => (
                    <tr key={Product.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {Product.id}
                        </td><td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {Product.createdAt}
                        </td><td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {Product.productID}
                        </td><td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {Product.name}
                        </td><td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {Product.regulatoryStatus}
                        </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/Products/${Product.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(Product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}