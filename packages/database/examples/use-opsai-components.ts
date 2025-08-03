import { 
  // Core context and discovery
  discoveryContext,
  DiscoveryContextManager,
  
  // Data discovery and integration
  createDataDiscoveryService,
  
  // Schema analysis and validation
  createSchemaAnalyzer,
  createSchemaValidator,
  createMigrationValidator,
  
  // Data transformation
  createDataTransformationPipeline,
  
  // UI generation and component registry
  ComponentRegistry,
  createAdaptiveUIGenerator,
  
  // State management and synchronization
  createStateSynchronizer,
  createWorkflowUIBridge,
  createRealtimeStateManager,
  
  // Orchestration
  createDiscoveryOrchestrator
} from '@opsai/core';

import { prisma } from '@opsai/database';
import { AuthService } from '@opsai/auth';

// Example: Using the Discovery Orchestrator
async function useDiscoveryOrchestrator() {
  // 1. Initialize the discovery orchestrator
  const orchestrator = createDiscoveryOrchestrator({
    tenantId: 'tenant-123',
    projectName: 'My SaaS Platform',
    dataDiscovery: {
      enableCaching: true,
      cacheExpiry: 3600,
      maxRetries: 3,
      retryDelay: 1000
    },
    uiConfig: {
      framework: 'react',
      styling: 'tailwind',
      componentLibrary: 'shadcn',
      features: {
        darkMode: true,
        responsive: true,
        accessibility: true
      }
    },
    customizations: {
      theme: {
        primaryColor: '#0066CC',
        fontFamily: 'Inter'
      }
    }
  });

  // 2. Configure data sources
  const sourceConfigs = [
    {
      type: 'postgresql',
      connectionConfig: {
        host: 'localhost',
        port: 5432,
        database: 'myapp',
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
        baseUrl: 'https://api.example.com',
        version: 'v1'
      },
      credentials: {
        apiKey: process.env.API_KEY
      }
    }
  ];

  // 3. Execute discovery flow
  const result = await orchestrator.executeDiscoveryFlow(sourceConfigs);

  console.log('Discovery completed:', {
    discoveryId: result.discoveryId,
    modelsGenerated: result.schemaAnalysis.recommendedSchema.length,
    businessFlowsIdentified: result.businessFlows.recommendedFlows.length,
    uiPagesGenerated: result.uiStructure.pages.length
  });

  return result;
}

// Example: Using the Component Registry
async function useComponentRegistry() {
  // 1. Get or create component registry
  const registry = new ComponentRegistry({
    enableAutoDiscovery: true,
    enableHotReload: true,
    enableVersioning: true
  });

  // 2. Register a custom component
  await registry.register({
    id: 'customer-form',
    name: 'CustomerForm',
    type: 'form',
    category: 'data-entry',
    version: '1.0.0',
    description: 'Customer data entry form with validation',
    props: [
      {
        name: 'onSubmit',
        type: { name: 'function' },
        required: true,
        businessMeaning: 'Form submission handler'
      },
      {
        name: 'initialData',
        type: { name: 'object' },
        required: false,
        businessMeaning: 'Pre-filled customer data'
      }
    ],
    events: [
      {
        name: 'submit',
        description: 'Fired when form is submitted',
        businessMeaning: 'Customer data submission'
      }
    ],
    metadata: {
      displayName: 'Customer Form',
      tags: ['customer', 'form', 'data-entry'],
      businessDomain: 'customer-management',
      examples: [{
        title: 'Basic Usage',
        description: 'Simple customer form',
        code: '<CustomerForm onSubmit={handleSubmit} />',
        props: { onSubmit: 'handleSubmit' }
      }]
    },
    implementation: {
      framework: 'react',
      source: `
        export const CustomerForm = ({ onSubmit, initialData }) => {
          const [formData, setFormData] = useState(initialData || {});
          
          const handleSubmit = (e) => {
            e.preventDefault();
            onSubmit(formData);
          };
          
          return (
            <form onSubmit={handleSubmit}>
              {/* Form fields */}
            </form>
          );
        }
      `,
      exportName: 'CustomerForm',
      dependencies: []
    }
  });

  // 3. Query components
  const formComponents = registry.query({
    type: 'form',
    businessDomain: 'customer-management'
  });

  // 4. Get component recommendations
  const recommendations = await registry.getRecommendations({
    businessEntity: 'Customer',
    purpose: 'data-entry'
  });

  return { registry, formComponents, recommendations };
}

// Example: Using State Synchronization
async function useStateSynchronization() {
  // 1. Create state synchronizer
  const synchronizer = createStateSynchronizer({
    enableRealtime: true,
    enableOptimisticUpdates: true,
    enableConflictResolution: true
  });

  // 2. Create workflow-UI bridge
  const bridge = createWorkflowUIBridge({
    enableAutoBinding: true,
    syncMode: 'realtime'
  }, synchronizer);

  // 3. Create realtime state manager
  const stateManager = createRealtimeStateManager({
    enableWebSocket: true,
    enableServerSentEvents: true
  }, synchronizer, bridge);

  // 4. Create a state channel
  const channelId = await stateManager.createChannel(
    'order-management',
    'tenant',
    {
      read: ['user', 'admin'],
      write: ['admin'],
      admin: ['admin']
    }
  );

  // 5. Subscribe to state changes
  const subscriptionId = stateManager.subscribe(
    channelId,
    'ui-component-123',
    async (update, state) => {
      console.log('State updated:', {
        path: update.path,
        value: update.newValue,
        timestamp: update.timestamp
      });
    },
    {
      filter: {
        paths: ['orders.*'],
        minPriority: 'normal'
      }
    }
  );

  // 6. Update state
  await stateManager.updateState(
    channelId,
    'orders.new',
    { id: '123', status: 'pending' },
    {
      metadata: {
        source: 'order-service',
        priority: 'high'
      }
    }
  );

  // 7. Create workflow-UI connection
  const connectionId = await bridge.createConnection(
    'order-workflow-1',
    'order-form-component',
    {
      bindings: [
        {
          id: 'status-binding',
          source: { type: 'workflow', id: 'order-workflow-1', path: 'variables.orderStatus' },
          target: { type: 'component', id: 'order-form-component', path: 'props.status' },
          options: { bidirectional: true }
        }
      ],
      eventMappings: [
        {
          id: 'submit-mapping',
          sourceEvent: {
            type: 'component',
            id: 'order-form-component',
            eventName: 'submit'
          },
          targetAction: {
            type: 'workflow',
            id: 'order-workflow-1',
            actionName: 'processOrder'
          }
        }
      ]
    }
  );

  return {
    synchronizer,
    bridge,
    stateManager,
    channelId,
    subscriptionId,
    connectionId
  };
}

// Example: Using Schema Analysis and Validation
async function useSchemaAnalysis() {
  // 1. Discover data source
  const discoveryService = createDataDiscoveryService({
    enableCaching: true,
    maxRetries: 3
  });

  const authResult = await discoveryService.authenticateDataSource({
    type: 'postgresql',
    connectionConfig: {
      host: 'localhost',
      database: 'myapp'
    },
    credentials: {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }
  });

  const discoveredData = await discoveryService.discoverDataStructure(authResult.sourceId!);

  // 2. Analyze schema
  const analyzer = createSchemaAnalyzer('tenant-123');
  const analysis = await analyzer.analyzeDiscoveredSchema(discoveredData.schema);

  // 3. Validate schema
  const validator = createSchemaValidator({ strict: true });
  const validation = await validator.validateSchema(analysis.recommendedSchema);

  if (!validation.valid) {
    console.log('Schema validation issues:', validation.errors);
    console.log('Suggestions:', validation.suggestions);
  }

  // 4. Check migration compatibility
  const migrationValidator = createMigrationValidator();
  const existingSchema = await analyzer.getExistingSchema();
  
  if (existingSchema) {
    const migrationCheck = await migrationValidator.validateMigration(
      existingSchema,
      analysis.recommendedSchema
    );

    if (!migrationCheck.safe) {
      console.log('Breaking changes detected:', migrationCheck.breakingChanges);
      console.log('Migration steps:', migrationCheck.steps);
    }
  }

  return {
    discoveredData,
    analysis,
    validation,
    prismaSchema: analyzer.generatePrismaSchemaFile(analysis.recommendedSchema)
  };
}

// Example: Using Data Transformation Pipeline
async function useDataTransformation() {
  // Assume we have discovered data and analysis from previous steps
  const discoveredSources = []; // Your discovered sources
  const schemaAnalysis = {}; // Your schema analysis
  const businessFlows = {}; // Your business flows

  // Create transformation pipeline
  const pipeline = createDataTransformationPipeline({
    enableDataMapping: true,
    enableSchemaEnrichment: true,
    enableBusinessLogicExtraction: true,
    enableRelationshipInference: true,
    enableDataQualityChecks: true
  });

  // Transform data
  const transformationResult = await pipeline.transform(
    discoveredSources,
    schemaAnalysis as any,
    businessFlows as any
  );

  console.log('Transformation complete:', {
    enrichedFields: transformationResult.transformationMetrics.enrichedFields,
    inferredRelationships: transformationResult.transformationMetrics.inferredRelationships,
    qualityScore: transformationResult.transformationMetrics.qualityScore,
    extractedRules: transformationResult.transformationMetrics.extractedRules
  });

  return transformationResult;
}

// Example: Using Discovery Context
async function useDiscoveryContext() {
  // Get the singleton discovery context
  const context = discoveryContext;

  // Subscribe to phase changes
  context.on('phase:changed', (data) => {
    console.log(`Discovery phase changed to: ${data.phase} (${data.progress}%)`);
    console.log(`Status: ${data.message}`);
  });

  // Subscribe to errors
  context.on('error:added', (error) => {
    console.error('Discovery error:', error);
  });

  // Update discovery phase
  context.updatePhase('analyzing', 50, 'Analyzing business patterns');

  // Add discovered entities
  context.addDiscoveredEntities([
    { name: 'Customer', type: 'core', count: 1000 },
    { name: 'Order', type: 'transaction', count: 5000 }
  ]);

  // Update performance metrics
  context.updatePerformanceMetrics({
    discoveryDuration: 5000,
    analysisTime: 3000,
    generationTime: 2000
  });

  // Get current context
  const currentContext = context.getContext();
  console.log('Current discovery context:', currentContext);

  return currentContext;
}

// Main example function
async function main() {
  try {
    console.log('🚀 Using @opsai components...\n');

    // 1. Use Discovery Context
    console.log('1️⃣ Setting up discovery context...');
    await useDiscoveryContext();

    // 2. Use Schema Analysis
    console.log('\n2️⃣ Analyzing schema...');
    const schemaResult = await useSchemaAnalysis();
    
    // 3. Use Component Registry
    console.log('\n3️⃣ Setting up component registry...');
    const componentResult = await useComponentRegistry();

    // 4. Use State Synchronization
    console.log('\n4️⃣ Setting up state synchronization...');
    const stateResult = await useStateSynchronization();

    // 5. Use Discovery Orchestrator (full flow)
    console.log('\n5️⃣ Running full discovery orchestration...');
    const orchestrationResult = await useDiscoveryOrchestrator();

    console.log('\n✅ All @opsai components demonstrated successfully!');

    return {
      schemaResult,
      componentResult,
      stateResult,
      orchestrationResult
    };

  } catch (error) {
    console.error('❌ Error using @opsai components:', error);
    throw error;
  }
}

// Export for use in other files
export {
  useDiscoveryOrchestrator,
  useComponentRegistry,
  useStateSynchronization,
  useSchemaAnalysis,
  useDataTransformation,
  useDiscoveryContext,
  main
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}