'use client';

import React from 'react';
// Import the onboarding component we built
import APIIntegrationOnboarding from '../../../../../packages/ui/src/components/onboarding/APIIntegrationOnboarding';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            OPSAI Platform Onboarding
          </h1>
          <p className="text-lg text-gray-600">
            Build your custom SaaS application with visual configuration
          </p>
        </div>
        
        <APIIntegrationOnboarding />
      </div>
    </div>
  );
}