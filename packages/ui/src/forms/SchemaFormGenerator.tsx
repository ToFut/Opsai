import React from 'react';
import { FormGenerator, FormConfig, FormFieldConfig } from './FormGenerator';
import { FieldValues } from 'react-hook-form';

// JSON Schema interfaces
export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  title?: string;
  description?: string;
  enum?: (string | number)[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: 'email' | 'date' | 'date-time' | 'password' | 'uri' | 'uuid';
  default?: any;
  'x-widget'?: 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'hidden';
  'x-options'?: Array<{ label: string; value: string | number }>;
  'x-depends-on'?: {
    field: string;
    value: any;
    condition?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
  'x-section'?: string;
}

export interface JSONSchema {
  type: 'object';
  title?: string;
  description?: string;
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  'x-layout'?: 'single' | 'two-column' | 'three-column';
  'x-theme'?: 'default' | 'minimal' | 'card';
  'x-sections'?: Array<{
    title: string;
    description?: string;
    fields: string[];
    collapsible?: boolean;
    defaultExpanded?: boolean;
  }>;
  'x-submit-label'?: string;
  'x-reset-label'?: string;
}

interface SchemaFormGeneratorProps {
  schema: JSONSchema;
  onSubmit: (data: FieldValues) => void | Promise<void>;
  onReset?: () => void;
  loading?: boolean;
  className?: string;
  defaultValues?: Record<string, any>;
}

export function SchemaFormGenerator({
  schema,
  onSubmit,
  onReset,
  loading = false,
  className = '',
  defaultValues = {}
}: SchemaFormGeneratorProps) {
  // Convert JSON Schema to FormConfig
  const convertSchemaToFormConfig = (schema: JSONSchema): FormConfig => {
    const fields: FormFieldConfig[] = [];

    Object.entries(schema.properties).forEach(([name, property]) => {
      const field: FormFieldConfig = {
        name,
        label: property.title || name,
        type: determineFieldType(property),
        placeholder: property.description,
        description: property.description,
        required: schema.required?.includes(name) || false,
        defaultValue: property.default,
        disabled: false,
        hidden: property['x-widget'] === 'hidden'
      };

      // Add validation rules
      if (property.minimum !== undefined || property.maximum !== undefined) {
        field.validation = {
          min: property.minimum,
          max: property.maximum
        };
      }

      if (property.minLength !== undefined || property.maxLength !== undefined) {
        field.validation = {
          ...field.validation,
          min: property.minLength,
          max: property.maxLength
        };
      }

      if (property.pattern) {
        field.validation = {
          ...field.validation,
          pattern: property.pattern
        };
      }

      // Add options for enums or explicit options
      if (property.enum) {
        field.options = property.enum.map(value => ({
          label: String(value),
          value
        }));
      } else if (property['x-options']) {
        field.options = property['x-options'];
      }

      // Handle array types for multi-select
      if (property.type === 'array' && property.items) {
        field.multiple = true;
        if (property.items.enum) {
          field.options = property.items.enum.map(value => ({
            label: String(value),
            value
          }));
        }
      }

      // Add dependencies
      if (property['x-depends-on']) {
        field.dependsOn = property['x-depends-on'];
      }

      // Add section
      if (property['x-section']) {
        field.section = property['x-section'];
      }

      fields.push(field);
    });

    return {
      title: schema.title,
      description: schema.description,
      fields,
      sections: schema['x-sections'],
      submitLabel: schema['x-submit-label'],
      resetLabel: schema['x-reset-label'],
      layout: schema['x-layout'] || 'single',
      theme: schema['x-theme'] || 'default'
    };
  };

  const determineFieldType = (property: JSONSchemaProperty): FormFieldConfig['type'] => {
    // Check for explicit widget first
    if (property['x-widget']) {
      switch (property['x-widget']) {
        case 'textarea': return 'textarea';
        case 'select': return 'select';
        case 'checkbox': return 'checkbox';
        case 'radio': return 'radio';
        case 'file': return 'file';
        case 'hidden': return 'text'; // Will be hidden via field.hidden
      }
    }

    // Determine type based on JSON Schema type and format
    switch (property.type) {
      case 'boolean':
        return 'checkbox';

      case 'integer':
      case 'number':
        return 'number';

      case 'array':
        return property.items?.enum ? 'select' : 'text';

      case 'string':
        if (property.format) {
          switch (property.format) {
            case 'email': return 'email';
            case 'password': return 'password';
            case 'date': return 'date';
            case 'date-time': return 'date';
            default: return 'text';
          }
        }

        if (property.enum) {
          return property.enum.length > 5 ? 'select' : 'radio';
        }

        // Use textarea for long text
        if (property.maxLength && property.maxLength > 100) {
          return 'textarea';
        }

        return 'text';

      default:
        return 'text';
    }
  };

  const formConfig = convertSchemaToFormConfig(schema);

  return (
    <FormGenerator
      config={formConfig}
      onSubmit={onSubmit}
      onReset={onReset}
      loading={loading}
      className={className}
      defaultValues={defaultValues}
    />
  );
}

// Utility function to generate form schema from TypeScript interfaces
export function generateSchemaFromInterface(interfaceDef: any): JSONSchema {
  // This would be implemented to parse TypeScript interface definitions
  // and generate JSON Schema. For now, return a basic schema
  return {
    type: 'object',
    title: 'Generated Form',
    properties: {},
    required: []
  };
}

// Example usage helper
export function createFormSchema(config: {
  title?: string;
  description?: string;
  fields: Record<string, {
    type: JSONSchemaProperty['type'];
    title?: string;
    description?: string;
    required?: boolean;
    options?: Array<{ label: string; value: any }>;
    widget?: JSONSchemaProperty['x-widget'];
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
    };
  }>;
  layout?: JSONSchema['x-layout'];
  theme?: JSONSchema['x-theme'];
}): JSONSchema {
  const properties: Record<string, JSONSchemaProperty> = {};
  const required: string[] = [];

  Object.entries(config.fields).forEach(([name, field]) => {
    const property: JSONSchemaProperty = {
      type: field.type,
      title: field.title || name,
      description: field.description
    };

    if (field.widget) {
      property['x-widget'] = field.widget;
    }

    if (field.options) {
      if (field.type === 'array') {
        property.items = {
          type: 'string',
          enum: field.options.map(opt => opt.value)
        };
      } else {
        property.enum = field.options.map(opt => opt.value);
      }
      property['x-options'] = field.options;
    }

    if (field.validation) {
      if (field.validation.min !== undefined) {
        if (field.type === 'string') {
          property.minLength = field.validation.min;
        } else {
          property.minimum = field.validation.min;
        }
      }
      if (field.validation.max !== undefined) {
        if (field.type === 'string') {
          property.maxLength = field.validation.max;
        } else {
          property.maximum = field.validation.max;
        }
      }
      if (field.validation.pattern) {
        property.pattern = field.validation.pattern;
      }
    }

    if (field.required) {
      required.push(name);
    }

    properties[name] = property;
  });

  return {
    type: 'object',
    title: config.title,
    description: config.description,
    properties,
    required: required.length > 0 ? required : undefined,
    'x-layout': config.layout,
    'x-theme': config.theme
  };
}