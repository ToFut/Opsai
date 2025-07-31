// Main analyzer exports
export { WebsiteAnalyzer, WebsiteAnalyzerConfig } from './services/website-analyzer'

// Processor exports
export { TechnologyDetector } from './processors/technology-detector'
export { IntegrationDetector } from './processors/integration-detector'
export { DataModelInferencer } from './processors/data-model-inferencer'
export { UserJourneyAnalyzer } from './processors/user-journey-analyzer'

// Re-export types from shared
export type {
  WebsiteAnalysis,
  BusinessProfile,
  TechnologyStack,
  Technology,
  DiscoveredIntegration,
  InferredDataModel,
  InferredField,
  InferredRelationship,
  UserJourney,
  JourneyStep,
  ConversionPoint,
  AnalysisMetrics,
  UnifiedSchema,
  UnifiedModel,
  UnifiedField,
  SchemaSettings
} from '@opsai/shared'