// Component Types
export interface ComponentConfig {
  name: string;
  type: string;
  props: Record<string, any>;
}

export interface ComponentVariant {
  name: string;
  props: Record<string, any>;
} 