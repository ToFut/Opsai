import { BusinessFlow, BusinessFlowAnalysis, UserJourney } from '@opsai/core/src/engines/business-flow-engine';
import { PrismaSchemaModel } from '@opsai/database/src/analyzers/schema-analyzer';
import { GeneratedYAMLStructure } from '@opsai/core/src/generators/dynamic-yaml-generator';

export interface AdaptiveUIConfig {
  framework: 'next.js' | 'react' | 'vue' | 'svelte';
  uiLibrary: 'tailwind' | 'chakra' | 'material-ui' | 'ant-design';
  theme: UITheme;
  responsiveBreakpoints: ResponsiveBreakpoints;
  accessibility: AccessibilityConfig;
  performance: PerformanceConfig;
}

export interface UITheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    error: string;
    warning: string;
    success: string;
    info: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
  };
  typography: {
    fontFamily: {
      primary: string;
      secondary: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface ResponsiveBreakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
  wide: string;
}

export interface AccessibilityConfig {
  enableScreenReader: boolean;
  highContrast: boolean;
  focusIndicators: boolean;
  keyboardNavigation: boolean;
  ariaLabels: boolean;
}

export interface PerformanceConfig {
  lazyLoading: boolean;
  codesplitting: boolean;
  imageOptimization: boolean;
  bundleAnalysis: boolean;
  caching: boolean;
}

export interface GeneratedUIStructure {
  pages: GeneratedPage[];
  components: GeneratedComponent[];
  layouts: GeneratedLayout[];
  forms: GeneratedForm[];
  tables: GeneratedTable[];
  dashboards: GeneratedDashboard[];
  navigation: NavigationStructure;
  routing: RoutingStructure;
  state: StateStructure;
  api: APIClientStructure;
}

export interface GeneratedPage {
  name: string;
  path: string;
  title: string;
  description: string;
  layout: string;
  components: string[];
  props: PageProps;
  businessFlow?: string;
  userJourney?: string;
  accessibility: PageAccessibility;
  seo: SEOConfig;
  code: PageCode;
}

export interface PageProps {
  params?: Record<string, string>;
  searchParams?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface PageAccessibility {
  title: string;
  description: string;
  landmark: string;
  skipLinks: string[];
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonical?: string;
}

export interface PageCode {
  tsx: string;
  css?: string;
  tests?: string;
}

export interface GeneratedComponent {
  name: string;
  type: ComponentType;
  category: ComponentCategory;
  props: ComponentProps;
  variants: ComponentVariant[];
  businessEntity?: string;
  accessibility: ComponentAccessibility;
  code: ComponentCode;
}

export type ComponentType = 
  | 'form'
  | 'table'
  | 'card'
  | 'modal'
  | 'sidebar'
  | 'header'
  | 'footer'
  | 'button'
  | 'input'
  | 'select'
  | 'chart'
  | 'list'
  | 'grid'
  | 'tabs'
  | 'accordion'
  | 'timeline'
  | 'stepper'
  | 'breadcrumb'
  | 'pagination'
  | 'search'
  | 'filter'
  | 'stats'
  | 'notification'
  | 'loader';

export type ComponentCategory = 
  | 'layout'
  | 'navigation'
  | 'data-display'
  | 'data-input'
  | 'feedback'
  | 'overlay'
  | 'disclosure'
  | 'media';

export interface ComponentProps {
  required: PropDefinition[];
  optional: PropDefinition[];
  events: EventDefinition[];
}

export interface PropDefinition {
  name: string;
  type: string;
  description: string;
  defaultValue?: any;
  validation?: ValidationRule[];
}

export interface EventDefinition {
  name: string;
  description: string;
  parameters: EventParameter[];
}

export interface EventParameter {
  name: string;
  type: string;
  description: string;
}

export interface ValidationRule {
  type: string;
  value: any;
  message: string;
}

export interface ComponentVariant {
  name: string;
  description: string;
  props: Record<string, any>;
  code: string;
}

export interface ComponentAccessibility {
  role: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  keyboardNavigation: boolean;
  focusManagement: boolean;
}

export interface ComponentCode {
  tsx: string;
  css?: string;
  tests?: string;
  stories?: string;
}

export interface GeneratedLayout {
  name: string;
  type: 'default' | 'auth' | 'admin' | 'minimal' | 'dashboard';
  description: string;
  sections: LayoutSection[];
  responsive: ResponsiveLayout;
  code: LayoutCode;
}

export interface LayoutSection {
  name: string;
  position: 'header' | 'sidebar' | 'main' | 'footer' | 'aside';
  component: string;
  sticky?: boolean;
  collapsible?: boolean;
}

export interface ResponsiveLayout {
  mobile: LayoutConfig;
  tablet: LayoutConfig;
  desktop: LayoutConfig;
}

export interface LayoutConfig {
  grid: string;
  spacing: string;
  direction: 'row' | 'column';
}

export interface LayoutCode {
  tsx: string;
  css: string;
}

export interface GeneratedForm {
  name: string;
  entity: string;
  purpose: 'create' | 'edit' | 'search' | 'filter';
  fields: FormField[];
  validation: FormValidation;
  submission: FormSubmission;
  layout: FormLayout;
  accessibility: FormAccessibility;
  code: FormCode;
}

export interface FormField {
  name: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation: FieldValidation[];
  options?: FieldOption[];
  conditional?: ConditionalLogic;
  accessibility: FieldAccessibility;
}

export type FormFieldType = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'image'
  | 'color'
  | 'range'
  | 'rich-text'
  | 'json'
  | 'tags';

export interface FieldValidation {
  type: string;
  value?: any;
  message: string;
  async?: boolean;
}

export interface FieldOption {
  label: string;
  value: any;
  disabled?: boolean;
  group?: string;
}

export interface ConditionalLogic {
  dependsOn: string;
  condition: string;
  value: any;
}

export interface FieldAccessibility {
  ariaLabel: string;
  ariaDescribedBy?: string;
  ariaRequired?: boolean;
  ariaInvalid?: boolean;
}

export interface FormValidation {
  schema: any;
  async: AsyncValidation[];
  custom: CustomValidation[];
}

export interface AsyncValidation {
  field: string;
  endpoint: string;
  debounce: number;
  message: string;
}

export interface CustomValidation {
  name: string;
  logic: string;
  message: string;
}

export interface FormSubmission {
  endpoint: string;
  method: string;
  transform?: string;
  onSuccess: SubmissionAction;
  onError: SubmissionAction;
}

export interface SubmissionAction {
  type: 'redirect' | 'message' | 'callback' | 'refresh';
  value: string;
}

export interface FormLayout {
  type: 'grid' | 'stack' | 'tabs' | 'steps';
  columns?: number;
  spacing: string;
  grouping: FieldGroup[];
}

export interface FieldGroup {
  title: string;
  fields: string[];
  collapsible?: boolean;
  description?: string;
}

export interface FormAccessibility {
  legend: string;
  instructions: string;
  errorSummary: boolean;
}

export interface FormCode {
  tsx: string;
  validation: string;
  types: string;
  tests: string;
}

export interface GeneratedTable {
  name: string;
  entity: string;
  columns: TableColumn[];
  features: TableFeatures;
  actions: TableAction[];
  filters: TableFilter[];
  accessibility: TableAccessibility;
  code: TableCode;
}

export interface TableColumn {
  key: string;
  title: string;
  type: string;
  sortable: boolean;
  filterable: boolean;
  searchable: boolean;
  width?: string;
  formatter?: string;
  accessor?: string;
}

export interface TableFeatures {
  sorting: boolean;
  filtering: boolean;
  searching: boolean;
  pagination: boolean;
  selection: boolean;
  export: boolean;
  resize: boolean;
}

export interface TableAction {
  name: string;
  type: 'button' | 'link' | 'dropdown';
  icon?: string;
  variant: 'primary' | 'secondary' | 'danger';
  condition?: string;
  permissions?: string[];
}

export interface TableFilter {
  key: string;
  type: string;
  label: string;
  options?: any[];
  operator?: string;
}

export interface TableAccessibility {
  caption: string;
  ariaLabel: string;
  keyboardNavigation: boolean;
}

export interface TableCode {
  tsx: string;
  hooks: string;
  types: string;
  tests: string;
}

export interface GeneratedDashboard {
  name: string;
  title: string;
  description: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  realtime: RealtimeConfig;
  code: DashboardCode;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  dataSource: string;
  configuration: WidgetConfig;
  position: WidgetPosition;
  responsive: WidgetResponsive;
}

export type WidgetType = 
  | 'stat'
  | 'chart'
  | 'table'
  | 'list'
  | 'progress'
  | 'gauge'
  | 'map'
  | 'calendar'
  | 'activity'
  | 'metric';

export interface WidgetConfig {
  query: string;
  refresh: number;
  format?: string;
  thresholds?: Threshold[];
  colors?: string[];
}

export interface Threshold {
  value: number;
  color: string;
  label: string;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetResponsive {
  mobile: WidgetPosition;
  tablet: WidgetPosition;
  desktop: WidgetPosition;
}

export interface DashboardLayout {
  type: 'grid' | 'masonry' | 'flex';
  columns: number;
  gap: string;
  responsive: boolean;
}

export interface DashboardFilter {
  key: string;
  type: string;
  label: string;
  defaultValue?: any;
  global: boolean;
}

export interface RealtimeConfig {
  enabled: boolean;
  websocket?: string;
  polling?: number;
  events: string[];
}

export interface DashboardCode {
  tsx: string;
  hooks: string;
  queries: string;
  types: string;
}

export interface NavigationStructure {
  primary: NavigationItem[];
  secondary?: NavigationItem[];
  mobile: MobileNavigation;
  breadcrumbs: BreadcrumbConfig;
}

export interface NavigationItem {
  label: string;
  path: string;
  icon?: string;
  badge?: string;
  children?: NavigationItem[];
  permissions?: string[];
  external?: boolean;
}

export interface MobileNavigation {
  type: 'drawer' | 'bottom-tabs' | 'dropdown';
  items: NavigationItem[];
}

export interface BreadcrumbConfig {
  enabled: boolean;
  separator: string;
  maxItems: number;
}

export interface RoutingStructure {
  type: 'file-based' | 'config-based';
  routes: RouteDefinition[];
  guards: RouteGuard[];
  middleware: RouteMiddleware[];
}

export interface RouteDefinition {
  path: string;
  component: string;
  layout?: string;
  guards?: string[];
  metadata?: Record<string, any>;
}

export interface RouteGuard {
  name: string;
  condition: string;
  redirect?: string;
}

export interface RouteMiddleware {
  name: string;
  order: number;
  condition?: string;
}

export interface StateStructure {
  type: 'redux' | 'zustand' | 'context' | 'swr' | 'react-query';
  stores: StateStore[];
  actions: StateAction[];
  selectors: StateSelector[];
}

export interface StateStore {
  name: string;
  entity?: string;
  initialState: any;
  reducers: StateReducer[];
}

export interface StateReducer {
  name: string;
  action: string;
  logic: string;
}

export interface StateAction {
  name: string;
  type: string;
  payload?: any;
  async?: boolean;
}

export interface StateSelector {
  name: string;
  store: string;
  path: string;
  computed?: boolean;
}

export interface APIClientStructure {
  type: 'axios' | 'fetch' | 'swr' | 'react-query';
  baseUrl: string;
  endpoints: APIEndpointClient[];
  interceptors: APIInterceptor[];
  hooks: APIHook[];
}

export interface APIEndpointClient {
  name: string;
  method: string;
  path: string;
  entity?: string;
  operation?: string;
  parameters?: APIParameter[];
  response: APIResponse;
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  location: 'path' | 'query' | 'body' | 'header';
}

export interface APIResponse {
  type: string;
  structure: any;
}

export interface APIInterceptor {
  type: 'request' | 'response' | 'error';
  logic: string;
}

export interface APIHook {
  name: string;
  endpoint: string;
  caching?: CachingConfig;
  invalidation?: InvalidationConfig;
}

export interface CachingConfig {
  ttl: number;
  key: string;
  strategy: 'cache-first' | 'network-first' | 'cache-only' | 'network-only';
}

export interface InvalidationConfig {
  triggers: string[];
  strategy: 'immediate' | 'background' | 'optimistic';
}

export class AdaptiveUIGenerator {
  private config: AdaptiveUIConfig;
  private businessFlows: BusinessFlowAnalysis;
  private schema: PrismaSchemaModel[];
  private yamlStructure: GeneratedYAMLStructure;

  constructor(
    config: AdaptiveUIConfig,
    businessFlows: BusinessFlowAnalysis,
    schema: PrismaSchemaModel[],
    yamlStructure: GeneratedYAMLStructure
  ) {
    this.config = config;
    this.businessFlows = businessFlows;
    this.schema = schema;
    this.yamlStructure = yamlStructure;
  }

  /**
   * Generate complete adaptive UI structure
   */
  async generateUI(): Promise<GeneratedUIStructure> {
    // Generate core UI components based on business flows
    const pages = await this.generatePages();
    const components = await this.generateComponents();
    const layouts = await this.generateLayouts();
    const forms = await this.generateForms();
    const tables = await this.generateTables();
    const dashboards = await this.generateDashboards();

    // Generate navigation and routing
    const navigation = await this.generateNavigation();
    const routing = await this.generateRouting();

    // Generate state management and API client
    const state = await this.generateStateManagement();
    const api = await this.generateAPIClient();

    return {
      pages,
      components,
      layouts,
      forms,
      tables,
      dashboards,
      navigation,
      routing,
      state,
      api
    };
  }

  /**
   * Generate pages based on business flows and user journeys
   */
  private async generatePages(): Promise<GeneratedPage[]> {
    const pages: GeneratedPage[] = [];

    // Generate dashboard page
    pages.push({
      name: 'Dashboard',
      path: '/',
      title: 'Dashboard',
      description: 'Main dashboard with overview metrics and quick actions',
      layout: 'default',
      components: ['StatsOverview', 'RecentActivity', 'QuickActions', 'MetricsChart'],
      props: {},
      accessibility: {
        title: 'Main Dashboard',
        description: 'Overview of key business metrics and recent activities',
        landmark: 'main',
        skipLinks: ['#main-content', '#navigation']
      },
      seo: {
        title: 'Dashboard - {{projectName}}',
        description: 'Business dashboard with key metrics and insights',
        keywords: ['dashboard', 'analytics', 'business', 'metrics']
      },
      code: this.generatePageCode('Dashboard', 'dashboard')
    });

    // Generate entity pages from schema
    for (const model of this.schema) {
      const entityName = model.name;
      const entityPath = this.toKebabCase(model.tableName);
      const entityDisplayName = this.humanize(entityName);

      // List page
      pages.push({
        name: `${entityName}List`,
        path: `/${entityPath}`,
        title: `${entityDisplayName} Management`,
        description: `Manage and view all ${entityDisplayName.toLowerCase()} records`,
        layout: 'default',
        components: [`${entityName}Table`, 'FilterPanel', 'SearchBar', 'BulkActions'],
        props: {
          searchParams: { page: 'number', limit: 'number', search: 'string', filter: 'string' }
        },
        businessFlow: `list_${entityPath}`,
        accessibility: {
          title: `${entityDisplayName} List`,
          description: `Browse and manage ${entityDisplayName.toLowerCase()} records`,
          landmark: 'main',
          skipLinks: ['#search', '#table', '#pagination']
        },
        seo: {
          title: `${entityDisplayName} Management - {{projectName}}`,
          description: `Manage your ${entityDisplayName.toLowerCase()} records efficiently`,
          keywords: [entityDisplayName.toLowerCase(), 'management', 'list']
        },
        code: this.generatePageCode(`${entityName}List`, 'entity-list', { entity: entityName })
      });

      // Detail page
      pages.push({
        name: `${entityName}Detail`,
        path: `/${entityPath}/[id]`,
        title: `${entityDisplayName} Details`,
        description: `View detailed information about a specific ${entityDisplayName.toLowerCase()}`,
        layout: 'default',
        components: [`${entityName}Details`, `${entityName}Actions`, 'RelatedData'],
        props: {
          params: { id: 'string' }
        },
        businessFlow: `view_${entityPath}`,
        accessibility: {
          title: `${entityDisplayName} Details`,
          description: `Detailed view of ${entityDisplayName.toLowerCase()} information`,
          landmark: 'main',
          skipLinks: ['#details', '#actions', '#related']
        },
        seo: {
          title: `{{${entityName.toLowerCase()}.name}} - ${entityDisplayName} Details`,
          description: `View detailed information about this ${entityDisplayName.toLowerCase()}`,
          keywords: [entityDisplayName.toLowerCase(), 'details', 'view']
        },
        code: this.generatePageCode(`${entityName}Detail`, 'entity-detail', { entity: entityName })
      });

      // Create/Edit pages
      const formPages = ['Create', 'Edit'];
      for (const action of formPages) {
        const isEdit = action === 'Edit';
        pages.push({
          name: `${entityName}${action}`,
          path: isEdit ? `/${entityPath}/[id]/edit` : `/${entityPath}/new`,
          title: `${action} ${entityDisplayName}`,
          description: `${action} a ${entityDisplayName.toLowerCase()} record`,
          layout: 'default',
          components: [`${entityName}Form`, 'FormActions', 'ValidationErrors'],
          props: isEdit ? { params: { id: 'string' } } : {},
          businessFlow: `${action.toLowerCase()}_${entityPath}`,
          accessibility: {
            title: `${action} ${entityDisplayName}`,
            description: `Form to ${action.toLowerCase()} ${entityDisplayName.toLowerCase()} information`,
            landmark: 'main',
            skipLinks: ['#form', '#actions']
          },
          seo: {
            title: `${action} ${entityDisplayName} - {{projectName}}`,
            description: `${action} ${entityDisplayName.toLowerCase()} with our easy-to-use form`,
            keywords: [entityDisplayName.toLowerCase(), action.toLowerCase(), 'form']
          },
          code: this.generatePageCode(`${entityName}${action}`, 'entity-form', { 
            entity: entityName, 
            action: action.toLowerCase() 
          })
        });
      }
    }

    // Generate workflow-specific pages
    for (const flow of this.businessFlows.recommendedFlows) {
      if (flow.category === 'core_business' && flow.complexity !== 'simple') {
        pages.push({
          name: this.toPascalCase(flow.name),
          path: `/${this.toKebabCase(flow.name)}`,
          title: flow.name,
          description: flow.description,
          layout: 'default',
          components: this.generateWorkflowComponents(flow),
          props: {},
          businessFlow: flow.id,
          accessibility: {
            title: flow.name,
            description: flow.description,
            landmark: 'main',
            skipLinks: ['#workflow-steps', '#actions']
          },
          seo: {
            title: `${flow.name} - {{projectName}}`,
            description: flow.description,
            keywords: [flow.name.toLowerCase(), 'workflow', 'process']
          },
          code: this.generatePageCode(
            this.toPascalCase(flow.name), 
            'workflow', 
            { flow: flow.name }
          )
        });
      }
    }

    return pages;
  }

  /**
   * Generate adaptive components based on business entities and patterns
   */
  private async generateComponents(): Promise<GeneratedComponent[]> {
    const components: GeneratedComponent[] = [];

    // Generate standard UI components
    const standardComponents = this.generateStandardComponents();
    components.push(...standardComponents);

    // Generate entity-specific components
    for (const model of this.schema) {
      const entityComponents = this.generateEntityComponents(model);
      components.push(...entityComponents);
    }

    // Generate workflow-specific components
    for (const flow of this.businessFlows.recommendedFlows) {
      const workflowComponents = this.generateWorkflowSpecificComponents(flow);
      components.push(...workflowComponents);
    }

    return components;
  }

  /**
   * Generate forms based on schema and business flows
   */
  private async generateForms(): Promise<GeneratedForm[]> {
    const forms: GeneratedForm[] = [];

    for (const model of this.schema) {
      // Create form
      forms.push(this.generateFormForEntity(model, 'create'));
      
      // Edit form (similar to create but with different validation)
      forms.push(this.generateFormForEntity(model, 'edit'));

      // Search/filter form
      forms.push(this.generateFormForEntity(model, 'search'));
    }

    // Generate workflow-specific forms
    for (const flow of this.businessFlows.recommendedFlows) {
      const workflowForms = this.generateWorkflowForms(flow);
      forms.push(...workflowForms);
    }

    return forms;
  }

  /**
   * Generate tables for data display
   */
  private async generateTables(): Promise<GeneratedTable[]> {
    const tables: GeneratedTable[] = [];

    for (const model of this.schema) {
      tables.push({
        name: `${model.name}Table`,
        entity: model.name,
        columns: this.generateTableColumns(model),
        features: {
          sorting: true,
          filtering: true,
          searching: true,
          pagination: true,
          selection: true,
          export: true,
          resize: true
        },
        actions: this.generateTableActions(model),
        filters: this.generateTableFilters(model),
        accessibility: {
          caption: `Table of ${this.humanize(model.name)} records`,
          ariaLabel: `${this.humanize(model.name)} data table`,
          keyboardNavigation: true
        },
        code: this.generateTableCode(model)
      });
    }

    return tables;
  }

  /**
   * Generate dashboards based on business context
   */
  private async generateDashboards(): Promise<GeneratedDashboard[]> {
    const dashboards: GeneratedDashboard[] = [];

    // Main dashboard
    dashboards.push({
      name: 'MainDashboard',
      title: 'Business Overview',
      description: 'Key business metrics and performance indicators',
      widgets: this.generateMainDashboardWidgets(),
      layout: {
        type: 'grid',
        columns: 12,
        gap: 'md',
        responsive: true
      },
      filters: [
        {
          key: 'dateRange',
          type: 'date-range',
          label: 'Date Range',
          defaultValue: { start: '30d', end: 'now' },
          global: true
        },
        {
          key: 'tenant',
          type: 'select',
          label: 'Tenant',
          global: true
        }
      ],
      realtime: {
        enabled: true,
        polling: 30000, // 30 seconds
        events: ['data_updated', 'alert_triggered']
      },
      code: {
        tsx: this.generateDashboardTSX('MainDashboard'),
        hooks: this.generateDashboardHooks('MainDashboard'),
        queries: this.generateDashboardQueries('MainDashboard'),
        types: this.generateDashboardTypes('MainDashboard')
      }
    });

    // Entity-specific dashboards
    const coreEntities = this.schema.filter(model => 
      model.metadata.isCore && 
      model.metadata.accessPattern !== 'write-heavy'
    );

    for (const entity of coreEntities) {
      dashboards.push({
        name: `${entity.name}Dashboard`,
        title: `${this.humanize(entity.name)} Analytics`,
        description: `Analytics and insights for ${this.humanize(entity.name).toLowerCase()}`,
        widgets: this.generateEntityDashboardWidgets(entity),
        layout: {
          type: 'grid',
          columns: 12,
          gap: 'md',
          responsive: true
        },
        filters: this.generateEntityDashboardFilters(entity),
        realtime: {
          enabled: false,
          polling: 60000,
          events: [`${entity.name.toLowerCase()}_updated`]
        },
        code: {
          tsx: this.generateDashboardTSX(`${entity.name}Dashboard`),
          hooks: this.generateDashboardHooks(`${entity.name}Dashboard`),
          queries: this.generateDashboardQueries(`${entity.name}Dashboard`),
          types: this.generateDashboardTypes(`${entity.name}Dashboard`)
        }
      });
    }

    return dashboards;
  }

  // Helper methods for code generation

  private generatePageCode(name: string, template: string, context?: any): PageCode {
    const tsx = this.generateTSXTemplate(template, { name, ...context });
    const css = this.generateCSSTemplate(template, { name, ...context });
    const tests = this.generateTestTemplate('page', { name, ...context });

    return { tsx, css, tests };
  }

  private generateTSXTemplate(template: string, context: any): string {
    // This would use actual template engine in practice
    return `// Generated ${template} component for ${context.name}
import React from 'react';
import { Layout } from '@/components/Layout';

export default function ${context.name}() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">${context.name}</h1>
        {/* Generated content based on ${template} template */}
      </div>
    </Layout>
  );
}`;
  }

  private generateCSSTemplate(template: string, context: any): string {
    return `/* Generated styles for ${context.name} */
.${this.toKebabCase(context.name)} {
  /* Component-specific styles */
}`;
  }

  private generateTestTemplate(type: string, context: any): string {
    return `// Generated tests for ${context.name}
import { render, screen } from '@testing-library/react';
import ${context.name} from './${context.name}';

describe('${context.name}', () => {
  it('renders correctly', () => {
    render(<${context.name} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});`;
  }

  private generateStandardComponents(): GeneratedComponent[] {
    // Generate standard UI components like Button, Input, Modal, etc.
    return [];
  }

  private generateEntityComponents(model: PrismaSchemaModel): GeneratedComponent[] {
    const components: GeneratedComponent[] = [];
    const entityName = model.name;

    // Details component
    components.push({
      name: `${entityName}Details`,
      type: 'card',
      category: 'data-display',
      props: {
        required: [
          { name: 'data', type: entityName, description: `${entityName} data` }
        ],
        optional: [
          { name: 'loading', type: 'boolean', description: 'Loading state', defaultValue: false }
        ],
        events: []
      },
      variants: [
        { name: 'default', description: 'Default view', props: {}, code: '' },
        { name: 'compact', description: 'Compact view', props: { compact: true }, code: '' }
      ],
      businessEntity: entityName,
      accessibility: {
        role: 'region',
        ariaLabel: `${entityName} details`,
        keyboardNavigation: false,
        focusManagement: false
      },
      code: {
        tsx: this.generateEntityDetailsComponent(model),
        css: this.generateEntityDetailsCSS(model),
        tests: this.generateEntityDetailsTests(model),
        stories: this.generateEntityDetailsStories(model)
      }
    });

    return components;
  }

  private generateWorkflowSpecificComponents(flow: BusinessFlow): GeneratedComponent[] {
    // Generate components specific to business workflows
    return [];
  }

  private generateFormForEntity(model: PrismaSchemaModel, purpose: 'create' | 'edit' | 'search'): GeneratedForm {
    const fields = model.fields
      .filter(field => {
        // Exclude system fields for user forms
        if (purpose !== 'search') {
          return !['id', 'createdAt', 'updatedAt', 'tenantId'].includes(field.name);
        }
        // For search, include searchable fields
        return field.searchable || field.indexed;
      })
      .map(field => this.convertPrismaFieldToFormField(field, purpose));

    return {
      name: `${model.name}${this.capitalize(purpose)}Form`,
      entity: model.name,
      purpose,
      fields,
      validation: this.generateFormValidation(model, purpose),
      submission: {
        endpoint: `/api/${model.tableName}`,
        method: purpose === 'create' ? 'POST' : purpose === 'edit' ? 'PUT' : 'GET',
        onSuccess: {
          type: purpose === 'search' ? 'callback' : 'redirect',
          value: purpose === 'search' ? 'handleSearchResults' : `/${this.toKebabCase(model.tableName)}`
        },
        onError: {
          type: 'message',
          value: `Failed to ${purpose} ${model.name.toLowerCase()}`
        }
      },
      layout: {
        type: purpose === 'search' ? 'grid' : 'stack',
        columns: purpose === 'search' ? 3 : 1,
        spacing: 'md',
        grouping: this.generateFieldGroups(model, purpose)
      },
      accessibility: {
        legend: `${this.capitalize(purpose)} ${this.humanize(model.name)}`,
        instructions: `Fill out the form to ${purpose} a ${model.name.toLowerCase()}`,
        errorSummary: true
      },
      code: {
        tsx: this.generateFormTSX(model, purpose),
        validation: this.generateFormValidationCode(model, purpose),
        types: this.generateFormTypes(model, purpose),
        tests: this.generateFormTests(model, purpose)
      }
    };
  }

  private generateWorkflowForms(flow: BusinessFlow): GeneratedForm[] {
    // Generate forms specific to business workflows
    return [];
  }

  private generateWorkflowComponents(flow: BusinessFlow): string[] {
    return flow.steps.map(step => `${this.toPascalCase(step.name)}Step`);
  }

  private generateTableColumns(model: PrismaSchemaModel): TableColumn[] {
    return model.fields
      .filter(field => !['tenantId'].includes(field.name))
      .slice(0, 8) // Limit columns for performance
      .map(field => ({
        key: field.name,
        title: this.humanize(field.name),
        type: field.type.toLowerCase(),
        sortable: field.indexed || field.businessMeaning === 'date',
        filterable: field.businessMeaning === 'status' || field.businessMeaning === 'identifier',
        searchable: field.searchable,
        width: this.inferColumnWidth(field),
        formatter: this.inferColumnFormatter(field),
        accessor: field.name
      }));
  }

  private generateTableActions(model: PrismaSchemaModel): TableAction[] {
    return [
      {
        name: 'View',
        type: 'link',
        icon: 'eye',
        variant: 'secondary',
        permissions: [`${model.name.toLowerCase()}:read`]
      },
      {
        name: 'Edit',
        type: 'link',
        icon: 'edit',
        variant: 'secondary',
        permissions: [`${model.name.toLowerCase()}:update`]
      },
      {
        name: 'Delete',
        type: 'button',
        icon: 'trash',
        variant: 'danger',
        permissions: [`${model.name.toLowerCase()}:delete`]
      }
    ];
  }

  private generateTableFilters(model: PrismaSchemaModel): TableFilter[] {
    return model.fields
      .filter(field => 
        field.businessMeaning === 'status' || 
        field.businessMeaning === 'date' ||
        field.type === 'Boolean'
      )
      .map(field => ({
        key: field.name,
        type: this.inferFilterType(field),
        label: this.humanize(field.name),
        options: this.inferFilterOptions(field),
        operator: this.inferFilterOperator(field)
      }));
  }

  private generateTableCode(model: PrismaSchemaModel): TableCode {
    return {
      tsx: this.generateTableTSX(model),
      hooks: this.generateTableHooks(model),
      types: this.generateTableTypes(model),
      tests: this.generateTableTests(model)
    };
  }

  // Navigation and routing generation
  private async generateNavigation(): Promise<NavigationStructure> {
    const primaryNav = this.generatePrimaryNavigation();
    const mobileNav = this.generateMobileNavigation(primaryNav);
    
    return {
      primary: primaryNav,
      mobile: mobileNav,
      breadcrumbs: {
        enabled: true,
        separator: '/',
        maxItems: 4
      }
    };
  }

  private generatePrimaryNavigation(): NavigationItem[] {
    const nav: NavigationItem[] = [
      { label: 'Dashboard', path: '/', icon: 'home' }
    ];

    // Add entity navigation
    const coreEntities = this.schema.filter(model => model.metadata.isCore);
    for (const entity of coreEntities) {
      nav.push({
        label: this.humanize(entity.name, true),
        path: `/${this.toKebabCase(entity.tableName)}`,
        icon: this.inferEntityIcon(entity),
        permissions: [`${entity.name.toLowerCase()}:read`]
      });
    }

    // Add workflow navigation
    const workflowNav = this.businessFlows.recommendedFlows
      .filter(flow => flow.category === 'core_business' && flow.priority > 7)
      .map(flow => ({
        label: flow.name,
        path: `/${this.toKebabCase(flow.name)}`,
        icon: 'workflow',
        permissions: flow.steps.some(step => step.entity) 
          ? [`${flow.steps.find(step => step.entity)?.entity?.toLowerCase()}:read`]
          : []
      }));

    nav.push(...workflowNav);

    return nav;
  }

  private generateMobileNavigation(primaryNav: NavigationItem[]): MobileNavigation {
    return {
      type: 'drawer',
      items: primaryNav
    };
  }

  private async generateRouting(): Promise<RoutingStructure> {
    return {
      type: 'file-based',
      routes: [], // Will be generated from pages
      guards: [
        {
          name: 'auth',
          condition: 'user?.isAuthenticated === true',
          redirect: '/login'
        },
        {
          name: 'admin',
          condition: 'user?.role === "admin"',
          redirect: '/unauthorized'
        }
      ],
      middleware: [
        { name: 'auth', order: 1 },
        { name: 'tenant', order: 2 },
        { name: 'rbac', order: 3 }
      ]
    };
  }

  private async generateStateManagement(): Promise<StateStructure> {
    return {
      type: 'zustand',
      stores: this.generateStores(),
      actions: this.generateActions(),
      selectors: this.generateSelectors()
    };
  }

  private async generateAPIClient(): Promise<APIClientStructure> {
    return {
      type: 'react-query',
      baseUrl: '/api/v1',
      endpoints: this.generateAPIEndpoints(),
      interceptors: this.generateAPIInterceptors(),
      hooks: this.generateAPIHooks()
    };
  }

  // Helper methods
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|[\s-_])(\w)/g, (_, letter) => letter.toUpperCase()).replace(/[\s-_]/g, '');
  }

  private toKebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  }

  private humanize(str: string, plural = false): string {
    const humanized = str.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    return plural ? this.pluralize(humanized) : humanized;
  }

  private pluralize(str: string): string {
    if (str.endsWith('y')) return str.slice(0, -1) + 'ies';
    if (str.endsWith('s')) return str + 'es';
    return str + 's';
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Placeholder methods for complex generation logic
  private convertPrismaFieldToFormField(field: any, purpose: string): FormField {
    return {
      name: field.name,
      type: this.mapPrismaTypeToFormType(field.type),
      label: this.humanize(field.name),
      required: !field.isOptional && purpose !== 'search',
      validation: this.generateFieldValidation(field, purpose),
      accessibility: {
        ariaLabel: this.humanize(field.name),
        ariaRequired: !field.isOptional && purpose !== 'search'
      }
    };
  }

  private mapPrismaTypeToFormType(type: string): FormFieldType {
    const mapping: Record<string, FormFieldType> = {
      'String': 'text',
      'Int': 'number',
      'Float': 'number',
      'Boolean': 'checkbox',
      'DateTime': 'datetime',
      'Json': 'json'
    };
    return mapping[type] || 'text';
  }

  private generateFieldValidation(field: any, purpose: string): FieldValidation[] {
    const validations: FieldValidation[] = [];
    
    if (!field.isOptional && purpose !== 'search') {
      validations.push({
        type: 'required',
        message: `${this.humanize(field.name)} is required`
      });
    }

    return validations;
  }

  private generateFormValidation(model: PrismaSchemaModel, purpose: string): FormValidation {
    return {
      schema: {},
      async: [],
      custom: []
    };
  }

  private generateFieldGroups(model: PrismaSchemaModel, purpose: string): FieldGroup[] {
    return [
      {
        title: 'Basic Information',
        fields: model.fields.slice(0, 5).map(f => f.name)
      }
    ];
  }

  // Additional placeholder methods would be implemented here
  private generateFormTSX(model: PrismaSchemaModel, purpose: string): string { return ''; }
  private generateFormValidationCode(model: PrismaSchemaModel, purpose: string): string { return ''; }
  private generateFormTypes(model: PrismaSchemaModel, purpose: string): string { return ''; }
  private generateFormTests(model: PrismaSchemaModel, purpose: string): string { return ''; }
  private generateEntityDetailsComponent(model: PrismaSchemaModel): string { return ''; }
  private generateEntityDetailsCSS(model: PrismaSchemaModel): string { return ''; }
  private generateEntityDetailsTests(model: PrismaSchemaModel): string { return ''; }
  private generateEntityDetailsStories(model: PrismaSchemaModel): string { return ''; }
  private generateTableTSX(model: PrismaSchemaModel): string { return ''; }
  private generateTableHooks(model: PrismaSchemaModel): string { return ''; }
  private generateTableTypes(model: PrismaSchemaModel): string { return ''; }
  private generateTableTests(model: PrismaSchemaModel): string { return ''; }
  private generateMainDashboardWidgets(): DashboardWidget[] { return []; }
  private generateEntityDashboardWidgets(entity: PrismaSchemaModel): DashboardWidget[] { return []; }
  private generateEntityDashboardFilters(entity: PrismaSchemaModel): DashboardFilter[] { return []; }
  private generateDashboardTSX(name: string): string { return ''; }
  private generateDashboardHooks(name: string): string { return ''; }
  private generateDashboardQueries(name: string): string { return ''; }
  private generateDashboardTypes(name: string): string { return ''; }
  private generateStores(): StateStore[] { return []; }
  private generateActions(): StateAction[] { return []; }
  private generateSelectors(): StateSelector[] { return []; }
  private generateAPIEndpoints(): APIEndpointClient[] { return []; }
  private generateAPIInterceptors(): APIInterceptor[] { return []; }
  private generateAPIHooks(): APIHook[] { return []; }
  private inferColumnWidth(field: any): string { return 'auto'; }
  private inferColumnFormatter(field: any): string { return 'default'; }
  private inferFilterType(field: any): string { return 'text'; }
  private inferFilterOptions(field: any): any[] { return []; }
  private inferFilterOperator(field: any): string { return 'contains'; }
  private inferEntityIcon(entity: PrismaSchemaModel): string { return 'table'; }
}

// Factory function
export function createAdaptiveUIGenerator(
  config: AdaptiveUIConfig,
  businessFlows: BusinessFlowAnalysis,
  schema: PrismaSchemaModel[],
  yamlStructure: GeneratedYAMLStructure
): AdaptiveUIGenerator {
  return new AdaptiveUIGenerator(config, businessFlows, schema, yamlStructure);
}