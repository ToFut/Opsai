'use client'

import React from 'react'
import AirbyteIntegrationHub from '@/components/AirbyteIntegrationHub'

export default function TestIntegrationsPage() {
  const handleIntegrationsComplete = (connections: any[]) => {
    console.log('✅ Integrations completed:', connections)
    alert(`Successfully connected ${connections.length} integrations!`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 OAuth Integration Test
          </h1>
          <p className="text-gray-600">
            This page tests the OAuth integration flow directly using the AirbyteIntegrationHub component.
          </p>
        </div>
        
        <AirbyteIntegrationHub
          tenantId={`test_tenant_${Date.now()}`}
          businessProfile={{
            industry: 'saas',
            businessType: 'b2b',
            size: 'medium',
            description: 'A demo SaaS business for testing integrations'
          }}
          onIntegrationsComplete={handleIntegrationsComplete}
        />
      </div>
    </div>
  )
}