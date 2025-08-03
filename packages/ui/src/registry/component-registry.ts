import { Logger } from '@opsai/shared';

export interface ComponentRegistryConfig {
  enableAutoDiscovery?: boolean;
  enableHotReload?: boolean;
  enableVersioning?: boolean;
  cacheDuration?: number;
}

export interface RegisteredComponent {
  id: string;
  name: string;
  type: ComponentType;
  category: ComponentCategory;
  version: string;
  description?: string;
  props: ComponentProp[];
  events: ComponentEvent[];
  slots?: ComponentSlot[];
  dependencies?: string[];
  metadata: ComponentMetadata;
  implementation: ComponentImplementation;
}

export type ComponentType = 
  | 'base' 
  | 'form' 
  | 'data' 
  | 'layout' 
  | 'navigation' 
  | 'feedback' 
  | 'business' 
  | 'chart' 
  | 'widget';

export type ComponentCategory = 
  | 'input'
  | 'display'
  | 'container'
  | 'navigation'
  | 'feedback'
  | 'data-entry'
  | 'data-display'
  | 'business-logic'
  | 'visualization'
  | 'utility';

export interface ComponentProp {
  name: string;
  type: PropType;
  required: boolean;
  defaultValue?: any;
  description?: string;
  validation?: PropValidation;
  businessMeaning?: string;
}

export interface PropType {
  name: string;
  isArray?: boolean;
  isOptional?: boolean;
  enumValues?: string[];
  shape?: Record<string, PropType>;
}

export interface PropValidation {
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: string;
}

export interface ComponentEvent {
  name: string;
  description?: string;
  payload?: PropType;
  businessMeaning?: string;
}

export interface ComponentSlot {
  name: string;
  description?: string;
  accepts?: string[];
  required?: boolean;
}

export interface ComponentMetadata {
  displayName: string;
  icon?: string;
  tags: string[];
  businessDomain?: string;
  usageGuidelines?: string;
  examples?: ComponentExample[];
  accessibility?: AccessibilityInfo;
  performance?: PerformanceInfo;
}

export interface ComponentExample {
  title: string;
  description?: string;
  code: string;
  props: Record<string, any>;
}

export interface AccessibilityInfo {
  wcagLevel: 'A' | 'AA' | 'AAA';
  ariaRoles: string[];
  keyboardNav: boolean;
  screenReaderSupport: boolean;
}

export interface PerformanceInfo {
  renderTime: number;
  bundleSize: number;
  lazyLoadable: boolean;
  memoizable: boolean;
}

export interface ComponentImplementation {
  framework: 'react' | 'vue' | 'angular' | 'svelte';
  source: string;
  compiledSource?: string;
  cssModule?: string;
  dependencies: ComponentDependency[];
  exportName: string;
}

export interface ComponentDependency {
  name: string;
  version: string;
  type: 'npm' | 'local' | 'peer';
}

export interface ComponentQuery {
  type?: ComponentType | ComponentType[];
  category?: ComponentCategory | ComponentCategory[];
  tags?: string[];
  businessDomain?: string;
  framework?: string;
  version?: string;
  search?: string;
}

export interface ComponentVariant {
  name: string;
  description?: string;
  props: Record<string, any>;
  previewImage?: string;
}

export class ComponentRegistry {
  private components: Map<string, RegisteredComponent> = new Map();
  private componentsByType: Map<ComponentType, Set<string>> = new Map();
  private componentsByCategory: Map<ComponentCategory, Set<string>> = new Map();
  private componentsByTag: Map<string, Set<string>> = new Map();
  private config: ComponentRegistryConfig;
  private logger: Logger;
  private versionHistory: Map<string, RegisteredComponent[]> = new Map();

  constructor(config?: ComponentRegistryConfig) {
    this.config = {
      enableAutoDiscovery: true,
      enableHotReload: false,
      enableVersioning: true,
      cacheDuration: 3600000, // 1 hour
      ...config
    };
    this.logger = new Logger('ComponentRegistry');
    this.initializeRegistry();
  }

  /**
   * Register a new component
   */
  async register(component: RegisteredComponent): Promise<void> {
    const componentId = this.generateComponentId(component);
    
    // Validate component
    const validation = await this.validateComponent(component);
    if (!validation.valid) {
      throw new Error(`Component validation failed: ${validation.errors.join(', ')}`);
    }

    // Store previous version if versioning is enabled
    if (this.config.enableVersioning && this.components.has(componentId)) {
      const existing = this.components.get(componentId)!;
      const history = this.versionHistory.get(componentId) || [];
      history.push(existing);
      this.versionHistory.set(componentId, history);
    }

    // Register component
    this.components.set(componentId, component);
    
    // Update indexes
    this.updateIndexes(componentId, component);
    
    this.logger.info(`Registered component: ${component.name} (${componentId})`);
    
    // Emit registration event
    this.emit('component:registered', { componentId, component });
  }

  /**
   * Get component by ID
   */
  get(componentId: string): RegisteredComponent | null {
    return this.components.get(componentId) || null;
  }

  /**
   * Get component by name
   */
  getByName(name: string): RegisteredComponent | null {
    for (const component of this.components.values()) {
      if (component.name === name) {
        return component;
      }
    }
    return null;
  }

  /**
   * Query components
   */
  query(query: ComponentQuery): RegisteredComponent[] {
    let results = Array.from(this.components.values());

    // Filter by type
    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      results = results.filter(c => types.includes(c.type));
    }

    // Filter by category
    if (query.category) {
      const categories = Array.isArray(query.category) ? query.category : [query.category];
      results = results.filter(c => categories.includes(c.category));
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(c => 
        query.tags!.some(tag => c.metadata.tags.includes(tag))
      );
    }

    // Filter by business domain
    if (query.businessDomain) {
      results = results.filter(c => 
        c.metadata.businessDomain === query.businessDomain
      );
    }

    // Filter by framework
    if (query.framework) {
      results = results.filter(c => 
        c.implementation.framework === query.framework
      );
    }

    // Search by name or description
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower) ||
        c.metadata.displayName.toLowerCase().includes(searchLower)
      );
    }

    return results;
  }

  /**
   * Get components by type
   */
  getByType(type: ComponentType): RegisteredComponent[] {
    const componentIds = this.componentsByType.get(type) || new Set();
    return Array.from(componentIds)
      .map(id => this.components.get(id)!)
      .filter(Boolean);
  }

  /**
   * Get components by category
   */
  getByCategory(category: ComponentCategory): RegisteredComponent[] {
    const componentIds = this.componentsByCategory.get(category) || new Set();
    return Array.from(componentIds)
      .map(id => this.components.get(id)!)
      .filter(Boolean);
  }

  /**
   * Get components by tag
   */
  getByTag(tag: string): RegisteredComponent[] {
    const componentIds = this.componentsByTag.get(tag) || new Set();
    return Array.from(componentIds)
      .map(id => this.components.get(id)!)
      .filter(Boolean);
  }

  /**
   * Generate component code
   */
  async generateComponent(
    componentId: string,
    props: Record<string, any>,
    options?: GenerateOptions
  ): Promise<GeneratedComponent> {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component not found: ${componentId}`);
    }

    // Validate props
    const propValidation = await this.validateProps(component, props);
    if (!propValidation.valid) {
      throw new Error(`Invalid props: ${propValidation.errors.join(', ')}`);
    }

    // Generate code based on framework
    const code = await this.generateComponentCode(component, props, options);
    
    return {
      componentId,
      name: component.name,
      code,
      dependencies: component.implementation.dependencies,
      css: component.implementation.cssModule,
      props: this.normalizeProps(component, props)
    };
  }

  /**
   * Create component instance
   */
  async createInstance(
    componentId: string,
    props: Record<string, any>,
    context?: ComponentContext
  ): Promise<ComponentInstance> {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component not found: ${componentId}`);
    }

    const instanceId = this.generateInstanceId();
    
    return {
      instanceId,
      componentId,
      props: this.normalizeProps(component, props),
      state: {},
      context: context || {},
      lifecycle: 'created',
      events: [],
      performance: {
        createdAt: Date.now(),
        renders: 0,
        lastRenderTime: 0
      }
    };
  }

  /**
   * Get component recommendations
   */
  async getRecommendations(
    context: RecommendationContext
  ): Promise<ComponentRecommendation[]> {
    const recommendations: ComponentRecommendation[] = [];
    
    // Get components matching the business entity
    if (context.businessEntity) {
      const entityComponents = this.query({
        businessDomain: context.businessEntity
      });
      
      recommendations.push(...entityComponents.map(c => ({
        component: c,
        reason: `Designed for ${context.businessEntity} entities`,
        score: 0.9
      })));
    }

    // Get components matching the purpose
    if (context.purpose) {
      const purposeComponents = this.query({
        tags: [context.purpose]
      });
      
      recommendations.push(...purposeComponents.map(c => ({
        component: c,
        reason: `Suitable for ${context.purpose}`,
        score: 0.8
      })));
    }

    // Sort by score and remove duplicates
    return this.deduplicateRecommendations(recommendations)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  /**
   * Validate component
   */
  private async validateComponent(component: RegisteredComponent): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate required fields
    if (!component.id || !component.name) {
      errors.push('Component must have id and name');
    }

    // Validate props
    for (const prop of component.props) {
      if (!prop.name || !prop.type) {
        errors.push(`Invalid prop definition: ${prop.name}`);
      }
    }

    // Validate implementation
    if (!component.implementation.source) {
      errors.push('Component must have implementation source');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate props
   */
  private async validateProps(
    component: RegisteredComponent,
    props: Record<string, any>
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check required props
    for (const propDef of component.props) {
      if (propDef.required && !(propDef.name in props)) {
        errors.push(`Missing required prop: ${propDef.name}`);
      }

      // Validate prop type
      if (propDef.name in props) {
        const value = props[propDef.name];
        if (!this.validatePropType(value, propDef.type)) {
          errors.push(`Invalid type for prop ${propDef.name}`);
        }

        // Custom validation
        if (propDef.validation) {
          const validationResult = this.validatePropValue(value, propDef.validation);
          if (!validationResult.valid) {
            errors.push(...validationResult.errors);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate component code
   */
  private async generateComponentCode(
    component: RegisteredComponent,
    props: Record<string, any>,
    options?: GenerateOptions
  ): Promise<string> {
    const framework = options?.framework || component.implementation.framework;
    
    switch (framework) {
      case 'react':
        return this.generateReactCode(component, props, options);
      case 'vue':
        return this.generateVueCode(component, props, options);
      case 'angular':
        return this.generateAngularCode(component, props, options);
      case 'svelte':
        return this.generateSvelteCode(component, props, options);
      default:
        throw new Error(`Unsupported framework: ${framework}`);
    }
  }

  /**
   * Generate React component code
   */
  private generateReactCode(
    component: RegisteredComponent,
    props: Record<string, any>,
    options?: GenerateOptions
  ): string {
    const propsString = Object.entries(props)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        } else if (typeof value === 'boolean') {
          return value ? key : '';
        } else {
          return `${key}={${JSON.stringify(value)}}`;
        }
      })
      .filter(Boolean)
      .join(' ');

    return `<${component.name} ${propsString} />`;
  }

  // Additional code generation methods for other frameworks...

  /**
   * Initialize registry with built-in components
   */
  private async initializeRegistry(): Promise<void> {
    // Register built-in components
    await this.registerBuiltInComponents();
    
    // Auto-discover components if enabled
    if (this.config.enableAutoDiscovery) {
      await this.discoverComponents();
    }
  }

  /**
   * Register built-in components
   */
  private async registerBuiltInComponents(): Promise<void> {
    // Register base components
    const baseComponents: RegisteredComponent[] = [
      {
        id: 'button',
        name: 'Button',
        type: 'base',
        category: 'input',
        version: '1.0.0',
        description: 'Basic button component',
        props: [
          {
            name: 'label',
            type: { name: 'string' },
            required: true,
            description: 'Button label'
          },
          {
            name: 'onClick',
            type: { name: 'function' },
            required: false,
            description: 'Click handler'
          },
          {
            name: 'variant',
            type: { name: 'string', enumValues: ['primary', 'secondary', 'danger'] },
            required: false,
            defaultValue: 'primary'
          }
        ],
        events: [
          {
            name: 'click',
            description: 'Emitted when button is clicked'
          }
        ],
        metadata: {
          displayName: 'Button',
          tags: ['form', 'action', 'interactive'],
          accessibility: {
            wcagLevel: 'AA',
            ariaRoles: ['button'],
            keyboardNav: true,
            screenReaderSupport: true
          },
          performance: {
            renderTime: 5,
            bundleSize: 2048,
            lazyLoadable: false,
            memoizable: true
          }
        },
        implementation: {
          framework: 'react',
          source: 'export const Button = ({ label, onClick, variant = "primary" }) => <button className={`btn btn-${variant}`} onClick={onClick}>{label}</button>',
          exportName: 'Button',
          dependencies: []
        }
      },
      // Add more built-in components...
    ];

    for (const component of baseComponents) {
      await this.register(component);
    }
  }

  /**
   * Auto-discover components
   */
  private async discoverComponents(): Promise<void> {
    // Implementation for auto-discovering components from file system
    this.logger.info('Auto-discovering components...');
  }

  /**
   * Update component indexes
   */
  private updateIndexes(componentId: string, component: RegisteredComponent): void {
    // Update type index
    if (!this.componentsByType.has(component.type)) {
      this.componentsByType.set(component.type, new Set());
    }
    this.componentsByType.get(component.type)!.add(componentId);

    // Update category index
    if (!this.componentsByCategory.has(component.category)) {
      this.componentsByCategory.set(component.category, new Set());
    }
    this.componentsByCategory.get(component.category)!.add(componentId);

    // Update tag indexes
    for (const tag of component.metadata.tags) {
      if (!this.componentsByTag.has(tag)) {
        this.componentsByTag.set(tag, new Set());
      }
      this.componentsByTag.get(tag)!.add(componentId);
    }
  }

  /**
   * Generate component ID
   */
  private generateComponentId(component: RegisteredComponent): string {
    return component.id || `${component.type}-${component.name.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Generate instance ID
   */
  private generateInstanceId(): string {
    return `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Normalize props
   */
  private normalizeProps(
    component: RegisteredComponent,
    props: Record<string, any>
  ): Record<string, any> {
    const normalized: Record<string, any> = {};

    for (const propDef of component.props) {
      if (propDef.name in props) {
        normalized[propDef.name] = props[propDef.name];
      } else if (propDef.defaultValue !== undefined) {
        normalized[propDef.name] = propDef.defaultValue;
      }
    }

    return normalized;
  }

  /**
   * Validate prop type
   */
  private validatePropType(value: any, type: PropType): boolean {
    if (type.isOptional && (value === null || value === undefined)) {
      return true;
    }

    switch (type.name) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'function':
        return typeof value === 'function';
      case 'object':
        return typeof value === 'object' && value !== null;
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * Validate prop value
   */
  private validatePropValue(value: any, validation: PropValidation): ValidationResult {
    const errors: string[] = [];

    if (validation.min !== undefined && value < validation.min) {
      errors.push(`Value must be at least ${validation.min}`);
    }

    if (validation.max !== undefined && value > validation.max) {
      errors.push(`Value must be at most ${validation.max}`);
    }

    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      errors.push(`Value must match pattern: ${validation.pattern}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Deduplicate recommendations
   */
  private deduplicateRecommendations(
    recommendations: ComponentRecommendation[]
  ): ComponentRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      const id = rec.component.id;
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  /**
   * Generate Vue component code
   */
  private generateVueCode(
    component: RegisteredComponent,
    props: Record<string, any>,
    options?: GenerateOptions
  ): string {
    const propsString = Object.entries(props)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `:${key}="'${value}'"`;
        } else {
          return `:${key}="${JSON.stringify(value)}"`;
        }
      })
      .join(' ');

    return `<${component.name} ${propsString} />`;
  }

  /**
   * Generate Angular component code
   */
  private generateAngularCode(
    component: RegisteredComponent,
    props: Record<string, any>,
    options?: GenerateOptions
  ): string {
    const propsString = Object.entries(props)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `[${key}]="'${value}'"`;
        } else {
          return `[${key}]="${JSON.stringify(value)}"`;
        }
      })
      .join(' ');

    return `<${component.name} ${propsString}></${component.name}>`;
  }

  /**
   * Generate Svelte component code
   */
  private generateSvelteCode(
    component: RegisteredComponent,
    props: Record<string, any>,
    options?: GenerateOptions
  ): string {
    const propsString = Object.entries(props)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        } else {
          return `${key}={${JSON.stringify(value)}}`;
        }
      })
      .join(' ');

    return `<${component.name} ${propsString} />`;
  }

  /**
   * Emit events (simplified event emitter)
   */
  private emit(event: string, data: any): void {
    // In a real implementation, this would use a proper event emitter
    console.log(`Event: ${event}`, data);
  }
}

// Type definitions
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface GenerateOptions {
  framework?: string;
  typescript?: boolean;
  style?: 'inline' | 'module' | 'styled';
}

interface GeneratedComponent {
  componentId: string;
  name: string;
  code: string;
  dependencies: ComponentDependency[];
  css?: string;
  props: Record<string, any>;
}

interface ComponentContext {
  theme?: string;
  locale?: string;
  userRole?: string;
  businessContext?: any;
}

interface ComponentInstance {
  instanceId: string;
  componentId: string;
  props: Record<string, any>;
  state: Record<string, any>;
  context: ComponentContext;
  lifecycle: 'created' | 'mounted' | 'updated' | 'destroyed';
  events: ComponentEvent[];
  performance: {
    createdAt: number;
    renders: number;
    lastRenderTime: number;
  };
}

interface RecommendationContext {
  businessEntity?: string;
  purpose?: string;
  userRole?: string;
  dataType?: string;
  interactionType?: string;
}

interface ComponentRecommendation {
  component: RegisteredComponent;
  reason: string;
  score: number;
}

// Singleton instance
let registryInstance: ComponentRegistry | null = null;

export function getComponentRegistry(config?: ComponentRegistryConfig): ComponentRegistry {
  if (!registryInstance) {
    registryInstance = new ComponentRegistry(config);
  }
  return registryInstance;
}

// Export factory function
export function createComponentRegistry(config?: ComponentRegistryConfig): ComponentRegistry {
  return new ComponentRegistry(config);
}