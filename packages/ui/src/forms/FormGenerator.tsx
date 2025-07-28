import React from 'react';
import { useForm, FormProvider, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { FormField } from './FormField';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
  placeholder?: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => boolean | string;
  };
  options?: Array<{ label: string; value: string | number }>;
  multiple?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  dependsOn?: {
    field: string;
    value: any;
    condition?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
  section?: string;
}

export interface FormSection {
  title: string;
  description?: string;
  fields: string[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface FormConfig {
  title?: string;
  description?: string;
  fields: FormFieldConfig[];
  sections?: FormSection[];
  submitLabel?: string;
  resetLabel?: string;
  layout?: 'single' | 'two-column' | 'three-column';
  theme?: 'default' | 'minimal' | 'card';
}

export interface FormGeneratorProps {
  config: FormConfig;
  onSubmit: (data: FieldValues) => void | Promise<void>;
  onReset?: () => void;
  loading?: boolean;
  className?: string;
  defaultValues?: Record<string, any>;
}

export function FormGenerator({
  config,
  onSubmit,
  onReset,
  loading = false,
  className = '',
  defaultValues = {}
}: FormGeneratorProps) {
  // Generate Zod schema from field configurations
  const generateSchema = (fields: FormFieldConfig[]) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    fields.forEach(field => {
      let schema: z.ZodTypeAny;

      switch (field.type) {
        case 'email':
          schema = z.string().email('Invalid email address');
          break;
        case 'number':
          schema = z.number();
          if (field.validation?.min !== undefined) {
            schema = (schema as z.ZodNumber).min(field.validation.min);
          }
          if (field.validation?.max !== undefined) {
            schema = (schema as z.ZodNumber).max(field.validation.max);
          }
          break;
        case 'checkbox':
          schema = z.boolean();
          break;
        case 'select':
          if (field.multiple) {
            schema = z.array(z.string());
          } else {
            schema = z.string();
          }
          break;
        case 'date':
          schema = z.date();
          break;
        case 'file':
          schema = z.any(); // FileList or File
          break;
        default:
          schema = z.string();
          if (field.validation?.min !== undefined) {
            schema = (schema as z.ZodString).min(field.validation.min);
          }
          if (field.validation?.max !== undefined) {
            schema = (schema as z.ZodString).max(field.validation.max);
          }
          if (field.validation?.pattern) {
            schema = (schema as z.ZodString).regex(
              new RegExp(field.validation.pattern)
            );
          }
      }

      if (!field.required) {
        schema = schema.optional();
      }

      schemaFields[field.name] = schema;
    });

    return z.object(schemaFields);
  };

  const schema = generateSchema(config.fields);
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: { ...defaultValues }
  });

  const { handleSubmit, reset, watch } = methods;
  const watchedValues = watch();

  // Check field visibility based on dependencies
  const isFieldVisible = (field: FormFieldConfig): boolean => {
    if (field.hidden) return false;
    
    if (field.dependsOn) {
      const dependentValue = watchedValues[field.dependsOn.field];
      const condition = field.dependsOn.condition || 'equals';
      
      switch (condition) {
        case 'equals':
          return dependentValue === field.dependsOn.value;
        case 'not_equals':
          return dependentValue !== field.dependsOn.value;
        case 'contains':
          return Array.isArray(dependentValue) 
            ? dependentValue.includes(field.dependsOn.value)
            : String(dependentValue).includes(String(field.dependsOn.value));
        case 'greater_than':
          return Number(dependentValue) > Number(field.dependsOn.value);
        case 'less_than':
          return Number(dependentValue) < Number(field.dependsOn.value);
        default:
          return true;
      }
    }
    
    return true;
  };

  const handleFormSubmit = async (data: FieldValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleReset = () => {
    reset();
    onReset?.();
  };

  const renderField = (field: FormFieldConfig) => {
    if (!isFieldVisible(field)) return null;

    return (
      <FormField
        key={field.name}
        field={field}
        disabled={loading || field.disabled}
      />
    );
  };

  const renderFields = () => {
    if (config.sections) {
      return config.sections.map(section => (
        <div key={section.title} className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{section.title}</h3>
            {section.description && (
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            )}
          </div>
          <div className={getLayoutClasses()}>
            {section.fields.map(fieldName => {
              const field = config.fields.find(f => f.name === fieldName);
              return field ? renderField(field) : null;
            })}
          </div>
        </div>
      ));
    }

    return (
      <div className={getLayoutClasses()}>
        {config.fields.map(renderField)}
      </div>
    );
  };

  const getLayoutClasses = () => {
    switch (config.layout) {
      case 'two-column':
        return 'grid grid-cols-1 md:grid-cols-2 gap-4';
      case 'three-column':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
      default:
        return 'space-y-4';
    }
  };

  const formContent = (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {config.title && (
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{config.title}</h2>
            {config.description && (
              <p className="text-muted-foreground">{config.description}</p>
            )}
          </div>
        )}

        {renderFields()}

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? 'Submitting...' : (config.submitLabel || 'Submit')}
          </Button>
          
          {onReset && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              {config.resetLabel || 'Reset'}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );

  if (config.theme === 'card') {
    return (
      <Card className={className}>
        <CardHeader>
          {config.title && <CardTitle>{config.title}</CardTitle>}
          {config.description && (
            <p className="text-sm text-muted-foreground">{config.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              {renderFields()}
              
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? 'Submitting...' : (config.submitLabel || 'Submit')}
                </Button>
                
                {onReset && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    {config.resetLabel || 'Reset'}
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    );
  }

  return <div className={className}>{formContent}</div>;
}