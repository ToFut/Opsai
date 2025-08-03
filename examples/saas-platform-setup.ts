/**
 * Example: Setting up a complete SaaS platform using @opsai components
 * This demonstrates the full discovery-to-deployment flow
 */

import {
  // Core orchestration
  createDiscoveryOrchestrator,
  
  // State management
  createRealtimeStateManager,
  createStateSynchronizer,
  createWorkflowUIBridge,
  
  // Discovery context
  discoveryContext,
  
  // Component registry
  ComponentRegistry
} from '@opsai/core';

import { AuthService } from '@opsai/auth';
import { prisma } from '@opsai/database';

/**
 * Step 1: Initialize a new SaaS platform
 */
export async function initializeSaaSPlatform(config: {
  tenantId: string;
  projectName: string;
  industry: string;
  dataSources: Array<{
    type: string;
    connectionConfig: any;
    credentials: any;
  }>;
}) {
  console.log(`🚀 Initializing SaaS platform: ${config.projectName}`);
  
  // 1. Setup authentication
  const authService = new AuthService();
  await authService.initialize();
  
  // 2. Create discovery orchestrator
  const orchestrator = createDiscoveryOrchestrator({
    tenantId: config.tenantId,
    projectName: config.projectName,
    dataDiscovery: {
      enableCaching: true,
      cacheExpiry: 3600,
      maxRetries: 3,
      retryDelay: 1000,
      enableSampleData: true
    },
    uiConfig: {
      framework: 'react',
      styling: 'tailwind',
      componentLibrary: 'shadcn',
      features: {
        darkMode: true,
        responsive: true,
        accessibility: true,
        multiLanguage: true
      }
    },
    customizations: {
      theme: {
        primaryColor: '#0066CC',
        secondaryColor: '#FF6B35',
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      features: {
        analytics: true,
        notifications: true,
        fileUpload: true,
        search: true
      },
      integrations: {
        payment: 'stripe',
        email: 'sendgrid',
        sms: 'twilio',
        storage: 'aws-s3'
      }
    }
  });

  // 3. Subscribe to discovery events
  discoveryContext.on('phase:changed', (data) => {
    console.log(`📊 Discovery ${data.phase}: ${data.progress}% - ${data.message}`);
  });

  discoveryContext.on('entity:discovered', (entity) => {
    console.log(`🔍 Found ${entity.type} entity: ${entity.name} (${entity.count} records)`);
  });

  // 4. Execute discovery
  const discoveryResult = await orchestrator.executeDiscoveryFlow(config.dataSources);

  // 5. Setup state management
  const stateManager = await setupStateManagement(config.tenantId);

  // 6. Setup component registry
  const componentRegistry = await setupComponentRegistry(discoveryResult);

  return {
    authService,
    orchestrator,
    discoveryResult,
    stateManager,
    componentRegistry
  };
}

/**
 * Step 2: Setup real-time state management
 */
async function setupStateManagement(tenantId: string) {
  // Create state synchronizer
  const stateSynchronizer = createStateSynchronizer({
    enableRealtime: true,
    enableOptimisticUpdates: true,
    enableConflictResolution: true,
    syncInterval: 100,
    enablePersistence: true
  });

  // Create workflow-UI bridge
  const workflowUIBridge = createWorkflowUIBridge({
    enableAutoBinding: true,
    enableStateValidation: true,
    syncMode: 'realtime'
  }, stateSynchronizer);

  // Create realtime state manager
  const stateManager = createRealtimeStateManager({
    enableWebSocket: true,
    enableServerSentEvents: true,
    enableLongPolling: true,
    heartbeatInterval: 30000,
    enableCompression: true,
    enableEncryption: true
  }, stateSynchronizer, workflowUIBridge);

  // Create default channels
  const channels = {
    global: await stateManager.createChannel('global', 'global'),
    tenant: await stateManager.createChannel(`tenant-${tenantId}`, 'tenant'),
    analytics: await stateManager.createChannel('analytics', 'global', {
      read: ['*'],
      write: ['system', 'admin'],
      admin: ['admin']
    })
  };

  return {
    stateSynchronizer,
    workflowUIBridge,
    stateManager,
    channels
  };
}

/**
 * Step 3: Setup component registry with discovered components
 */
async function setupComponentRegistry(discoveryResult: any) {
  const registry = new ComponentRegistry({
    enableAutoDiscovery: true,
    enableHotReload: true,
    enableVersioning: true
  });

  // Register components based on discovered entities
  for (const entity of discoveryResult.businessFlows.identifiedPatterns) {
    // Register list component
    await registry.register({
      id: `${entity.name.toLowerCase()}-list`,
      name: `${entity.name}List`,
      type: 'data',
      category: 'data-display',
      version: '1.0.0',
      description: `Display list of ${entity.name} records`,
      props: [
        {
          name: 'data',
          type: { name: 'array' },
          required: true,
          businessMeaning: `Array of ${entity.name} records`
        },
        {
          name: 'onRowClick',
          type: { name: 'function' },
          required: false,
          businessMeaning: 'Row click handler'
        }
      ],
      events: [
        {
          name: 'rowClick',
          description: 'Fired when a row is clicked',
          payload: { name: 'object' }
        }
      ],
      metadata: {
        displayName: `${entity.name} List`,
        tags: [entity.name.toLowerCase(), 'list', 'data-display'],
        businessDomain: entity.name.toLowerCase()
      },
      implementation: {
        framework: 'react',
        source: generateListComponent(entity),
        exportName: `${entity.name}List`,
        dependencies: []
      }
    });

    // Register form component
    await registry.register({
      id: `${entity.name.toLowerCase()}-form`,
      name: `${entity.name}Form`,
      type: 'form',
      category: 'data-entry',
      version: '1.0.0',
      description: `Form for creating/editing ${entity.name}`,
      props: [
        {
          name: 'initialData',
          type: { name: 'object' },
          required: false,
          businessMeaning: `Initial ${entity.name} data`
        },
        {
          name: 'onSubmit',
          type: { name: 'function' },
          required: true,
          businessMeaning: 'Form submission handler'
        }
      ],
      events: [
        {
          name: 'submit',
          description: 'Fired when form is submitted',
          payload: { name: 'object' }
        },
        {
          name: 'cancel',
          description: 'Fired when form is cancelled'
        }
      ],
      metadata: {
        displayName: `${entity.name} Form`,
        tags: [entity.name.toLowerCase(), 'form', 'data-entry'],
        businessDomain: entity.name.toLowerCase()
      },
      implementation: {
        framework: 'react',
        source: generateFormComponent(entity),
        exportName: `${entity.name}Form`,
        dependencies: []
      }
    });
  }

  return registry;
}

/**
 * Helper: Generate list component code
 */
function generateListComponent(entity: any): string {
  return `
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const ${entity.name}List = ({ data, onRowClick }) => {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            ${entity.keyAttributes.map(attr => 
              `<TableHead>${attr}</TableHead>`
            ).join('\n            ')}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow 
              key={index} 
              onClick={() => onRowClick?.(item)}
              className="cursor-pointer hover:bg-gray-50"
            >
              ${entity.keyAttributes.map(attr => 
                `<TableCell>{item.${attr}}</TableCell>`
              ).join('\n              ')}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};`;
}

/**
 * Helper: Generate form component code
 */
function generateFormComponent(entity: any): string {
  return `
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ${entity.name}Form = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState(initialData || {});

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      ${entity.keyAttributes.map(attr => `
      <div>
        <Label htmlFor="${attr}">${attr}</Label>
        <Input
          id="${attr}"
          value={formData.${attr} || ''}
          onChange={(e) => handleChange('${attr}', e.target.value)}
        />
      </div>`).join('')}
      
      <div className="flex gap-4 pt-4">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline">Cancel</Button>
      </div>
    </form>
  );
};`;
}

/**
 * Example usage
 */
async function setupHealthcarePlatform() {
  const platform = await initializeSaaSPlatform({
    tenantId: 'healthcare-tenant-1',
    projectName: 'MediCare Pro',
    industry: 'Healthcare',
    dataSources: [
      {
        type: 'postgresql',
        connectionConfig: {
          host: process.env.DB_HOST,
          port: 5432,
          database: 'healthcare_db',
          ssl: true
        },
        credentials: {
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD
        }
      },
      {
        type: 'rest-api',
        connectionConfig: {
          baseUrl: 'https://api.healthcare-provider.com',
          version: 'v2',
          timeout: 30000
        },
        credentials: {
          apiKey: process.env.HEALTHCARE_API_KEY
        }
      }
    ]
  });

  // Setup real-time features
  const { stateManager, channels } = platform.stateManager;

  // Subscribe to patient updates
  stateManager.subscribe(
    channels.tenant,
    'patient-monitor',
    async (update, state) => {
      if (update.path.startsWith('patients.') && update.metadata.priority === 'critical') {
        console.log('⚠️ Critical patient update:', update);
        // Trigger alerts, notifications, etc.
      }
    },
    {
      filter: {
        paths: ['patients.*'],
        minPriority: 'high'
      }
    }
  );

  // Create workflow-UI connections for patient management
  await platform.stateManager.workflowUIBridge.createConnection(
    'patient-intake-workflow',
    'patient-form-component',
    {
      bindings: [
        {
          id: 'patient-data',
          source: { type: 'workflow', id: 'patient-intake-workflow', path: 'variables.patientData' },
          target: { type: 'component', id: 'patient-form-component', path: 'props.initialData' },
          options: { bidirectional: true }
        }
      ],
      eventMappings: [
        {
          id: 'submit-patient',
          sourceEvent: {
            type: 'component',
            id: 'patient-form-component',
            eventName: 'submit'
          },
          targetAction: {
            type: 'workflow',
            id: 'patient-intake-workflow',
            actionName: 'processPatientIntake'
          }
        }
      ]
    }
  );

  console.log('✅ Healthcare platform setup complete!');
  
  return platform;
}

/**
 * Example: E-commerce platform
 */
async function setupEcommercePlatform() {
  return await initializeSaaSPlatform({
    tenantId: 'ecommerce-tenant-1',
    projectName: 'ShopFlow Pro',
    industry: 'E-commerce',
    dataSources: [
      {
        type: 'mysql',
        connectionConfig: {
          host: process.env.MYSQL_HOST,
          port: 3306,
          database: 'ecommerce_db'
        },
        credentials: {
          username: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD
        }
      },
      {
        type: 'stripe',
        connectionConfig: {
          apiVersion: '2023-10-16'
        },
        credentials: {
          secretKey: process.env.STRIPE_SECRET_KEY
        }
      },
      {
        type: 'shopify',
        connectionConfig: {
          shop: process.env.SHOPIFY_SHOP,
          apiVersion: '2024-01'
        },
        credentials: {
          accessToken: process.env.SHOPIFY_ACCESS_TOKEN
        }
      }
    ]
  });
}

// Export functions
export {
  initializeSaaSPlatform,
  setupHealthcarePlatform,
  setupEcommercePlatform,
  setupStateManagement,
  setupComponentRegistry
};