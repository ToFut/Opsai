// Core OpsAI platform services
export { YamlProcessor } from './processors/yaml-processor'
export { AppGenerator } from './generators/app-generator'
export { ConfigValidator } from './validators/config-validator'
export { TemplateEngine } from './engines/template-engine'

// AI Enhancement
export { AIEnhancer } from './services/ai-enhancer'
export type { AIEnhancementRequest, AIEnhancementResult } from './services/ai-enhancer'

// Types
export type { YamlConfig, AppConfig, GenerationOptions } from './types'

// Utilities
export { FileUtils } from './utils/file-utils'
export { Logger } from './utils/logger'

// Context - temporarily disabled due to build dependency issues
// export { discoveryContext, DiscoveryContextManager } from './context/discovery-context'
// export type { DiscoveryContext, DiscoveryPhase } from './context/discovery-context'

// State Management - temporarily disabled due to build dependency issues
// export { createStateSynchronizer, StateSynchronizer } from './sync/state-synchronizer'
// export type { StateSynchronizerConfig, WorkflowState, UIComponentState } from './sync/state-synchronizer'

// Bridges - temporarily disabled due to build dependency issues
// export { createWorkflowUIBridge, WorkflowUIBridge } from './bridges/workflow-ui-bridge'
// export type { WorkflowUIBridgeConfig, BridgeConnection, DataBinding, EventMapping } from './bridges/workflow-ui-bridge'

// Real-time State - temporarily disabled due to build dependency issues
// export { createRealtimeStateManager, RealtimeStateManager } from './state/realtime-state-manager'
// export type { RealtimeStateConfig, StateChannel, StateUpdate, StateSubscription } from './state/realtime-state-manager'

// Transformation - temporarily disabled due to build dependency issues
// export { createDataTransformationPipeline, DataTransformationPipeline } from './transformers/data-transformation-pipeline'
// export type { TransformationResult } from './transformers/data-transformation-pipeline'

// Orchestration - temporarily disabled due to build dependency issues
// export { createDiscoveryOrchestrator, DiscoveryOrchestrator } from './orchestrators/discovery-orchestrator' 