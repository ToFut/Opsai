'use client'

import React, { useState, useEffect } from 'react'
import { X, BarChart3, AlertCircle, Loader2 } from 'lucide-react'

interface Property {
  propertyId: string
  displayName: string
  measurementId: string
  accountName: string
  propertyName: string
}

interface GoogleAnalyticsPropertySelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (propertyId: string, measurementId: string) => void
  tenantId: string
}

export default function GoogleAnalyticsPropertySelector({
  isOpen,
  onClose,
  onSelect,
  tenantId
}: GoogleAnalyticsPropertySelectorProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [requiresManualEntry, setRequiresManualEntry] = useState(false)
  const [manualPropertyId, setManualPropertyId] = useState('')
  const [manualMeasurementId, setManualMeasurementId] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchProperties()
    }
  }, [isOpen])

  const fetchProperties = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/google/analytics-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (data.requiresManualEntry || data.properties.length === 0) {
          setRequiresManualEntry(true)
        } else {
          setProperties(data.properties)
        }
      } else {
        setError(data.error || 'Failed to fetch properties')
        setRequiresManualEntry(true)
      }
    } catch (err) {
      console.error('Error fetching properties:', err)
      setError('Failed to connect to Google Analytics')
      setRequiresManualEntry(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProperty = () => {
    if (requiresManualEntry) {
      if (manualPropertyId && manualMeasurementId) {
        onSelect(manualPropertyId, manualMeasurementId)
      }
    } else if (selectedProperty) {
      onSelect(selectedProperty.propertyId, selectedProperty.measurementId)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold">Select Google Analytics Property</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Choose which property to connect for analytics data
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Loading your Google Analytics properties...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Unable to load properties automatically</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && !requiresManualEntry && properties.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Select a property from your Google Analytics account:
              </p>
              {properties.map((property) => (
                <label
                  key={property.propertyId}
                  className={`block border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedProperty?.propertyId === property.propertyId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="property"
                    value={property.propertyId}
                    checked={selectedProperty?.propertyId === property.propertyId}
                    onChange={() => setSelectedProperty(property)}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{property.displayName}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Account: {property.accountName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Property ID: {property.propertyId} • Measurement ID: {property.measurementId}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedProperty?.propertyId === property.propertyId
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedProperty?.propertyId === property.propertyId && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {!loading && (requiresManualEntry || properties.length === 0) && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium mb-2">Manual Configuration Required</p>
                <p className="text-blue-700 text-sm">
                  We couldn't automatically fetch your properties. Please enter your Google Analytics IDs manually.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property ID
                  </label>
                  <input
                    type="text"
                    value={manualPropertyId}
                    onChange={(e) => setManualPropertyId(e.target.value)}
                    placeholder="e.g., 123456789"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Find this in Google Analytics → Admin → Property Settings
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Measurement ID
                  </label>
                  <input
                    type="text"
                    value={manualMeasurementId}
                    onChange={(e) => setManualMeasurementId(e.target.value)}
                    placeholder="e.g., G-XXXXXXXXXX"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Find this in Google Analytics → Admin → Data Streams → Web Stream
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-medium mb-2">How to find your IDs:</p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Analytics</a></li>
                  <li>Click the Admin gear icon (bottom left)</li>
                  <li>Under "Property", click "Property Settings" for Property ID</li>
                  <li>Under "Property", click "Data Streams" → "Web" for Measurement ID</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectProperty}
              disabled={
                (!requiresManualEntry && !selectedProperty) ||
                (requiresManualEntry && (!manualPropertyId || !manualMeasurementId))
              }
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                ((!requiresManualEntry && selectedProperty) ||
                 (requiresManualEntry && manualPropertyId && manualMeasurementId))
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Connect Property
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}