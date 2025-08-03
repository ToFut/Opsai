import { useContext, createContext, useEffect, useState } from 'react';

interface BusinessContext {
  industry: string;
  businessModel: string;
  currentUser: User;
  organization: Organization;
  permissions: Permission[];
  realTimeData: any;
}

interface User {
  id: string;
  email: string;
  role: string;
  department?: string;
  teamId?: string;
  preferences?: UserPreferences;
}

interface Organization {
  id: string;
  name: string;
  industry: string;
  size: string;
  region: string;
}

interface Permission {
  resource: string;
  actions: string[];
  conditions?: any[];
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: boolean;
}

const BusinessContextContext = createContext<BusinessContext | null>(null);

export const useBusinessContext = () => {
  const context = useContext(BusinessContextContext);
  
  if (!context) {
    // Return mock data for development
    return {
      getBusinessData: async (entity: string) => {
        return { data: [], total: 0 };
      },
      getCurrentUser: () => ({
        id: 'user-1',
        email: 'user@example.com',
        role: 'admin',
        department: 'IT',
        teamId: 'team-1'
      }),
      hasPermission: (resource: string, action: string) => true,
      getOrganization: () => ({
        id: 'org-1',
        name: 'Example Corp',
        industry: 'technology',
        size: 'medium',
        region: 'US'
      }),
      updateContext: (updates: Partial<BusinessContext>) => {
        console.log('Context update:', updates);
      }
    };
  }
  
  return {
    ...context,
    getBusinessData: async (entity: string) => {
      // Fetch business data based on context
      const response = await fetch(`/api/business-data/${entity}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    },
    getCurrentUser: () => context.currentUser,
    hasPermission: (resource: string, action: string) => {
      return context.permissions.some(p => 
        (p.resource === resource || p.resource === '*') &&
        (p.actions.includes(action) || p.actions.includes('*'))
      );
    },
    getOrganization: () => context.organization,
    updateContext: (updates: Partial<BusinessContext>) => {
      // Update context logic
    }
  };
};

export const BusinessContextProvider = BusinessContextContext.Provider;