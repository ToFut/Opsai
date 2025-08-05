// UI Types for the UI package
export interface UIComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: UIComponent[];
}

export interface UITheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export interface UILayout {
  type: 'grid' | 'flex' | 'stack';
  columns?: number;
  gap?: number;
  direction?: 'row' | 'column';
} 