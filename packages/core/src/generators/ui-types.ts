// Temporary type definitions for UI generator
// TODO: Move these to proper @opsai/ui package when created

export interface ThemeConfiguration {
  colors: Record<string, string>;
  typography: Record<string, any>;
}

export interface LayoutSystem {
  type: string;
  config: any;
}

export interface UIStateManagement {
  type: string;
  store: any;
}

export interface RoutingConfiguration {
  type: string;
  routes: any[];
}

export interface ThemingSystem {
  theme: any;
}

export interface AccessibilityFeatures {
  enabled: boolean;
  features: string[];
}

export interface ResponsiveDesign {
  breakpoints: Record<string, number>;
}

export interface DependencyConfiguration {
  dependencies: Record<string, string>;
}

export interface FrameworkConfiguration {
  framework: string;
  version: string;
}

export interface BuildConfiguration {
  build: any;
}

export interface DirectoryStructure {
  dirs: string[];
}

export interface EntryPoint {
  file: string;
}

export interface RouteDefinition {
  path: string;
  component: string;
}

export interface MiddlewareDefinition {
  name: string;
  handler: any;
}

export interface ProviderDefinition {
  name: string;
  provider: any;
}

export interface UtilityDefinition {
  name: string;
  utility: any;
}

// Component types
export interface LayoutComponent {
  name: string;
  type: 'layout';
}

export interface FormComponent {
  name: string;
  type: 'form';
}

export interface DataComponent {
  name: string;
  type: 'data';
}

export interface NavigationComponent {
  name: string;
  type: 'navigation';
}

export interface FeedbackComponent {
  name: string;
  type: 'feedback';
}

export interface OverlayComponent {
  name: string;
  type: 'overlay';
}

export interface ChartComponent {
  name: string;
  type: 'chart';
}

export interface SpecializationComponent {
  name: string;
  type: 'specialization';
}

// More UI types - simplified versions
export type ComponentProp = any;
export type ComponentVariant = any;
export type ComponentState = any;
export type AccessibilitySpec = any;
export type ResponsiveSpec = any;
export type ThemingSpec = any;
export type BusinessComponentContext = any;
export type ComponentImplementation = any;
export type DataRequirement = any;
export type BusinessLogicSpec = any;
export type ValidationSpec = any;
export type PermissionSpec = any;
export type NotificationSpec = any;
export type IntegrationSpec = any;
export type WorkflowIntegrationSpec = any;
export type RealTimeFeatureSpec = any;
export type ComponentHook = any;
export type ServiceIntegration = any;
export type StateIntegration = any;
export type EventHandlerSpec = any;
export type LifecycleHook = any;
export type ErrorHandlingSpec = any;
export type LoadingStateSpec = any;
export type CachingSpec = any;
export type NavigationStructure = any;
export type PagePermissionSpec = any;
export type SEOConfiguration = any;
export type AnalyticsConfiguration = any;
export type ComponentInstance = any;
export type PageDataRequirement = any;
export type PageSEOSpec = any;
export type PageAnalyticsSpec = any;
export type PageResponsiveSpec = any;
export type PageLoadingSpec = any;
export type PageErrorHandlingSpec = any;
export type PageImplementation = any;
export type AlertThreshold = any;
export type DashboardLayout = any;
export type DashboardTheme = any;
export type FilteringSystem = any;
export type DrillDownConfiguration = any;
export type ExportConfiguration = any;
export type SchedulingConfiguration = any;
export type DashboardAlertingSystem = any;
export type DashboardLayoutSpec = any;
export type WidgetInstance = any;
export type FilterDefinition = any;
export type RealTimeUpdateSpec = any;
export type CustomizationSpec = any;
export type PerformanceSpec = any;
export type DashboardImplementation = any;
export type DecisionSupportSpec = any;
export type BusinessAlertingSpec = any;
export type ComplianceReportingSpec = any;
export type DataSourceSpec = any;
export type VisualizationSpec = any;
export type InteractionSpec = any;
export type WidgetResponsiveSpec = any;
export type WidgetCustomizationSpec = any;
export type WidgetImplementation = any;
export type BenchmarkSpec = any;
export type FieldTypeDefinition = any;
export type ValidationRuleDefinition = any;
export type ConditionalLogicDefinition = any;
export type WizardDefinition = any;
export type FormTemplateDefinition = any;
export type FormAccessibilitySpec = any;
export type FormLocalizationSpec = any;
export type FormSection = any;
export type FormValidationSpec = any;
export type FormBusinessRuleSpec = any;
export type FormConditionalLogicSpec = any;
export type FormWorkflowIntegration = any;
export type FormAccessibilityFeatures = any;
export type FormResponsiveSpec = any;