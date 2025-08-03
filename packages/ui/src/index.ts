// Enhanced UI Generation and Components
export * from './generators/adaptive-ui-generator';
export * from './generators/intelligent-ui-generator';
export * from './generators/gmi-level-ui-generator';
export * from './generators/supabase-backend-generator';
export * from './generators/full-stack-generator';

// AI-Powered Components
export * from './components/ai/contextual-ai-chat';

// Intelligent Widgets
export * from './components/widgets/intelligent-dashboard-widget';

// Adaptive Interface Components
export * from './components/adaptive/role-adaptive-interface';

// Enhanced Hooks
export * from './hooks/useIntelligentState';
export * from './hooks/useBusinessContext';
export * from './hooks/useRealTimeUpdates';
export * from './hooks/useAIProvider';

// Component Registry
export * from './registry/component-registry';

// Form Generation
export * from './forms/dynamic-form-generator';
export * from './forms/intelligent-form-builder';

// Table Generation  
export * from './tables/adaptive-table-generator';
export * from './tables/intelligent-data-table';

// Layout Generation
export * from './layouts/adaptive-layout-generator';
export * from './layouts/responsive-layout-builder';

// Navigation
export * from './navigation/role-based-navigation';
export * from './navigation/adaptive-navigation';

// Charts and Visualizations
export * from './charts/intelligent-chart-generator';
export * from './charts/business-analytics-charts';

// Templates
export * from './templates/industry-templates';
export * from './templates/role-specific-templates';

// Utilities
export * from './utils/ui-utils';
export * from './utils/theme-generator';
export * from './utils/accessibility-helper';

// Types
export * from './types/ui-types';
export * from './types/component-types';
export * from './types/business-types';

// Main Generator Classes for External Use
export { GMILevelUIGenerator as MainUIGenerator } from './generators/gmi-level-ui-generator';
export { FullStackGenerator as MainFullStackGenerator } from './generators/full-stack-generator';

// Convenience exports for common use cases
export {
  // Primary generator for GMI-level applications
  GMILevelUIGenerator,
  
  // Full-stack generator with Supabase backend
  FullStackGenerator,
  
  // Supabase backend generator
  SupabaseBackendGenerator,
  
  // Intelligent state management
  useIntelligentState,
  createIntelligentStore,
  
  // AI-powered chat component
  ContextualAIChat,
  
  // Intelligent dashboard widgets
  IntelligentDashboardWidget,
  
  // Role-adaptive interfaces
  RoleAdaptiveInterface,
  
  // Core intelligent UI generator
  IntelligentUIGenerator
};

// Default export - Main UI Generator
export { GMILevelUIGenerator as default } from './generators/gmi-level-ui-generator';