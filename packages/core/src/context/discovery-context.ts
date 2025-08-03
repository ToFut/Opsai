import { EventEmitter } from 'events';
import { BusinessFlowAnalysis } from '../engines/business-flow-engine';
import { GeneratedYAMLStructure } from '../generators/dynamic-yaml-generator';
import { GeneratedWorkflowSystem } from '../generators/advanced-workflow-generator';

// Types defined locally to avoid circular dependencies
interface DiscoveredDataSource {
  id: string;
  name: string;
  type: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  metadata: Record<string, any>;
}

interface DiscoveredSchema {
  schemas: any[];
  relationships: any[];
  metadata?: Record<string, any>;
}

interface SchemaAnalysisResult {
  recommendedSchema: any[];
  migrations: any[];
  businessLogic: any;
  dataValidation: any[];
  indexRecommendations: any[];
  optimizations: any[];
}

interface PrismaSchemaModel {
  name: string;
  tableName: string;
  fields: any[];
  relations: any[];
}

interface GeneratedUIStructure {
  pages: any[];
  components: any[];
  navigation: any;
  theme: any;
}

export interface DiscoveryContext {
  tenantId: string;
  projectName: string;
  sessionId: string;
  status: DiscoveryStatus;
  discoveredSources: DiscoveredDataSource[];
  schemaAnalysis?: SchemaAnalysisResult;
  businessFlows?: BusinessFlowAnalysis;
  yamlStructure?: GeneratedYAMLStructure;
  uiStructure?: GeneratedUIStructure;
  workflowSystem?: GeneratedWorkflowSystem;
  errors: DiscoveryError[];
  metadata: DiscoveryMetadata;
}

export interface DiscoveryStatus {
  phase: DiscoveryPhase;
  progress: number;
  message: string;
  startedAt: Date;
  lastUpdatedAt: Date;
  completedAt?: Date;
}

export type DiscoveryPhase = 
  | 'initializing'
  | 'authenticating'
  | 'discovering'
  | 'analyzing'
  | 'generating'
  | 'validating'
  | 'completed'
  | 'failed';

export interface DiscoveryError {
  phase: DiscoveryPhase;
  component: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

export interface DiscoveryMetadata {
  domain?: string;
  industry?: string;
  dataComplexity: 'simple' | 'moderate' | 'complex';
  estimatedEntities: number;
  estimatedRelationships: number;
  recommendedFeatures: string[];
  performanceMetrics: PerformanceMetrics;
  customData?: Record<string, any>;
}

export interface PerformanceMetrics {
  discoveryDuration?: number;
  analysisDuration?: number;
  generationDuration?: number;
  totalDuration?: number;
  memoryCost?: number;
}

export class DiscoveryContextManager extends EventEmitter {
  private static instance: DiscoveryContextManager;
  private contexts: Map<string, DiscoveryContext> = new Map();
  private activeContext: DiscoveryContext | null = null;

  private constructor() {
    super();
  }

  public static getInstance(): DiscoveryContextManager {
    if (!DiscoveryContextManager.instance) {
      DiscoveryContextManager.instance = new DiscoveryContextManager();
    }
    return DiscoveryContextManager.instance;
  }

  /**
   * Create a new discovery context
   */
  public createContext(tenantId: string, projectName: string): DiscoveryContext {
    const sessionId = this.generateSessionId();
    const context: DiscoveryContext = {
      tenantId,
      projectName,
      sessionId,
      status: {
        phase: 'initializing',
        progress: 0,
        message: 'Initializing discovery session',
        startedAt: new Date(),
        lastUpdatedAt: new Date()
      },
      discoveredSources: [],
      errors: [],
      metadata: {
        dataComplexity: 'simple',
        estimatedEntities: 0,
        estimatedRelationships: 0,
        recommendedFeatures: [],
        performanceMetrics: {}
      }
    };

    this.contexts.set(sessionId, context);
    this.activeContext = context;
    this.emit('context:created', context);
    
    return context;
  }

  /**
   * Get active context
   */
  public getActiveContext(): DiscoveryContext {
    if (!this.activeContext) {
      throw new Error('No active discovery context');
    }
    return this.activeContext;
  }

  /**
   * Get context by session ID
   */
  public getContext(sessionId: string): DiscoveryContext | undefined {
    return this.contexts.get(sessionId);
  }

  /**
   * Update context phase and progress
   */
  public updatePhase(phase: DiscoveryPhase, progress: number, message: string): void {
    if (!this.activeContext) {
      throw new Error('No active discovery context');
    }

    this.activeContext.status = {
      ...this.activeContext.status,
      phase,
      progress,
      message,
      lastUpdatedAt: new Date()
    };

    if (phase === 'completed' || phase === 'failed') {
      this.activeContext.status.completedAt = new Date();
    }

    this.emit('phase:updated', {
      sessionId: this.activeContext.sessionId,
      phase,
      progress,
      message
    });

    this.saveContext();
  }

  /**
   * Add discovered source to context
   */
  public addDiscoveredSource(source: DiscoveredDataSource): void {
    if (!this.activeContext) {
      throw new Error('No active discovery context');
    }

    this.activeContext.discoveredSources.push(source);
    
    // Update metadata
    const totalEntities = source.schema.tables.length;
    const totalRelationships = source.schema.relationships.length;
    
    this.activeContext.metadata.estimatedEntities += totalEntities;
    this.activeContext.metadata.estimatedRelationships += totalRelationships;
    
    // Update complexity based on schema
    if (totalEntities > 20 || totalRelationships > 30) {
      this.activeContext.metadata.dataComplexity = 'complex';
    } else if (totalEntities > 10 || totalRelationships > 15) {
      this.activeContext.metadata.dataComplexity = 'moderate';
    }

    // Infer domain and industry
    if (!this.activeContext.metadata.domain) {
      this.activeContext.metadata.domain = source.schema.businessContext.domain;
      this.activeContext.metadata.industry = source.schema.businessContext.domain;
    }

    this.emit('source:discovered', {
      sessionId: this.activeContext.sessionId,
      source
    });

    this.saveContext();
  }

  /**
   * Set schema analysis results
   */
  public setSchemaAnalysis(analysis: SchemaAnalysisResult): void {
    if (!this.activeContext) {
      throw new Error('No active discovery context');
    }

    this.activeContext.schemaAnalysis = analysis;
    
    // Update recommended features based on analysis
    this.updateRecommendedFeatures(analysis);
    
    this.emit('schema:analyzed', {
      sessionId: this.activeContext.sessionId,
      analysis
    });

    this.saveContext();
  }

  /**
   * Set business flow analysis
   */
  public setBusinessFlows(flows: BusinessFlowAnalysis): void {
    if (!this.activeContext) {
      throw new Error('No active discovery context');
    }

    this.activeContext.businessFlows = flows;
    
    // Add workflow recommendations to features
    const workflowFeatures = flows.recommendedFlows
      .filter(f => f.priority > 7)
      .map(f => `workflow:${f.name.toLowerCase().replace(/\s+/g, '_')}`);
    
    this.activeContext.metadata.recommendedFeatures.push(...workflowFeatures);
    
    this.emit('flows:analyzed', {
      sessionId: this.activeContext.sessionId,
      flows
    });

    this.saveContext();
  }

  /**
   * Set YAML structure
   */
  public setYamlStructure(yaml: GeneratedYAMLStructure): void {
    if (!this.activeContext) {
      throw new Error('No active discovery context');
    }

    this.activeContext.yamlStructure = yaml;
    
    this.emit('yaml:generated', {
      sessionId: this.activeContext.sessionId,
      yaml
    });

    this.saveContext();
  }

  /**
   * Set UI structure
   */
  public setUIStructure(ui: GeneratedUIStructure): void {
    if (!this.activeContext) {
      throw new Error('No active discovery context');
    }

    this.activeContext.uiStructure = ui;
    
    this.emit('ui:generated', {
      sessionId: this.activeContext.sessionId,
      ui
    });

    this.saveContext();
  }

  /**
   * Set workflow system
   */
  public setWorkflowSystem(workflows: GeneratedWorkflowSystem): void {
    if (!this.activeContext) {
      throw new Error('No active discovery context');
    }

    this.activeContext.workflowSystem = workflows;
    
    this.emit('workflows:generated', {
      sessionId: this.activeContext.sessionId,
      workflows
    });

    this.saveContext();
  }

  /**
   * Add error to context
   */
  public addError(error: Omit<DiscoveryError, 'timestamp'>): void {
    if (!this.activeContext) {
      throw new Error('No active discovery context');
    }

    const fullError: DiscoveryError = {
      ...error,
      timestamp: new Date()
    };

    this.activeContext.errors.push(fullError);
    
    this.emit('error:added', {
      sessionId: this.activeContext.sessionId,
      error: fullError
    });

    // Update phase to failed if error is not recoverable
    if (!error.recoverable) {
      this.updatePhase('failed', this.activeContext.status.progress, `Failed: ${error.message}`);
    }

    this.saveContext();
  }

  /**
   * Update performance metrics
   */
  public updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>): void {
    if (!this.activeContext) {
      throw new Error('No active discovery context');
    }

    this.activeContext.metadata.performanceMetrics = {
      ...this.activeContext.metadata.performanceMetrics,
      ...metrics
    };

    if (this.activeContext.status.phase === 'completed') {
      const totalDuration = 
        (this.activeContext.status.completedAt!.getTime() - 
         this.activeContext.status.startedAt.getTime()) / 1000;
      
      this.activeContext.metadata.performanceMetrics.totalDuration = totalDuration;
    }

    this.emit('metrics:updated', {
      sessionId: this.activeContext.sessionId,
      metrics: this.activeContext.metadata.performanceMetrics
    });

    this.saveContext();
  }

  /**
   * Update custom data in the context metadata
   */
  public updateCustomData(key: string, data: any): void {
    if (!this.activeContext) {
      throw new Error('No active discovery context');
    }

    if (!this.activeContext.metadata.customData) {
      this.activeContext.metadata.customData = {};
    }

    this.activeContext.metadata.customData[key] = data;

    this.emit('customData:updated', {
      sessionId: this.activeContext.sessionId,
      key,
      data
    });

    this.saveContext();
  }

  /**
   * Validate current context state
   */
  public validateContext(): { valid: boolean; errors: string[] } {
    if (!this.activeContext) {
      return { valid: false, errors: ['No active context'] };
    }

    const errors: string[] = [];

    // Validate required data at each phase
    switch (this.activeContext.status.phase) {
      case 'discovering':
        if (this.activeContext.discoveredSources.length === 0) {
          errors.push('No data sources discovered');
        }
        break;
      
      case 'analyzing':
        if (!this.activeContext.schemaAnalysis) {
          errors.push('Schema analysis not completed');
        }
        break;
      
      case 'generating':
        if (!this.activeContext.businessFlows) {
          errors.push('Business flow analysis not completed');
        }
        break;
      
      case 'completed':
        if (!this.activeContext.yamlStructure || !this.activeContext.uiStructure) {
          errors.push('Generation not completed');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get context summary for display
   */
  public getContextSummary(): any {
    if (!this.activeContext) {
      return null;
    }

    return {
      sessionId: this.activeContext.sessionId,
      projectName: this.activeContext.projectName,
      status: this.activeContext.status,
      dataSources: this.activeContext.discoveredSources.length,
      entities: this.activeContext.metadata.estimatedEntities,
      relationships: this.activeContext.metadata.estimatedRelationships,
      complexity: this.activeContext.metadata.dataComplexity,
      errors: this.activeContext.errors.length,
      features: this.activeContext.metadata.recommendedFeatures.length,
      performance: this.activeContext.metadata.performanceMetrics
    };
  }

  /**
   * Clear context
   */
  public clearContext(sessionId?: string): void {
    if (sessionId) {
      this.contexts.delete(sessionId);
      if (this.activeContext?.sessionId === sessionId) {
        this.activeContext = null;
      }
    } else if (this.activeContext) {
      this.contexts.delete(this.activeContext.sessionId);
      this.activeContext = null;
    }

    this.emit('context:cleared', { sessionId });
  }

  private generateSessionId(): string {
    return `discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateRecommendedFeatures(analysis: SchemaAnalysisResult): void {
    if (!this.activeContext) return;

    const features: string[] = [];

    // Add features based on schema complexity
    if (analysis.recommendedSchema.length > 10) {
      features.push('advanced_search', 'bulk_operations', 'data_export');
    }

    // Add features based on relationships
    if (analysis.recommendedSchema.some(m => m.relations.length > 3)) {
      features.push('relationship_visualization', 'cascade_operations');
    }

    // Add features based on business logic
    if (analysis.businessLogic.validationRules.length > 20) {
      features.push('advanced_validation', 'business_rule_engine');
    }

    // Add performance features
    if (analysis.indexRecommendations.length > 5) {
      features.push('performance_monitoring', 'query_optimization');
    }

    this.activeContext.metadata.recommendedFeatures.push(...features);
  }

  private saveContext(): void {
    // In a real implementation, this would persist to database
    // For now, we just emit an event
    if (this.activeContext) {
      this.emit('context:saved', {
        sessionId: this.activeContext.sessionId
      });
    }
  }

  /**
   * Export context for debugging or sharing
   */
  public exportContext(): string {
    if (!this.activeContext) {
      throw new Error('No active discovery context');
    }

    return JSON.stringify(this.activeContext, null, 2);
  }

  /**
   * Import context from export
   */
  public importContext(contextData: string): DiscoveryContext {
    try {
      const context = JSON.parse(contextData) as DiscoveryContext;
      this.contexts.set(context.sessionId, context);
      this.activeContext = context;
      this.emit('context:imported', context);
      return context;
    } catch (error) {
      throw new Error('Invalid context data');
    }
  }
}

// Export singleton instance
export const discoveryContext = DiscoveryContextManager.getInstance();