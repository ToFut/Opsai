'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Patient {
  id: string
  id: string
  createdAt: string
  updatedAt: string
  patientId: string
  name: string
  diagnosis: string
}

export default function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching Patients:', error)
        setLoading(false)
      })
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this Patient?')) {
      try {
        await fetch(`/api/patients/${id}`, { method: 'DELETE' })
        setPatients(patients.filter(item => item.id !== id))
      } catch (error) {
        console.error('Error deleting Patient:', error)
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
          <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your Patients
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/patients/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
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
                        id
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        createdAt
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        updatedAt
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        patientId
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        name
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        diagnosis
                      </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {patient.id}
                        </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {patient.createdAt}
                        </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {patient.updatedAt}
                        </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {patient.patientId}
                        </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {patient.name}
                        </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {patient.diagnosis}
                        </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleDelete(patient.id)}
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