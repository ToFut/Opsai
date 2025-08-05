// Business Types
export interface BusinessConfig {
  name: string;
  type: string;
  industry: string;
}

export interface BusinessContext {
  config: BusinessConfig;
  userRole: string;
} 