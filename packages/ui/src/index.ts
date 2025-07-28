// Core Components
export { Button, buttonVariants } from './components/Button';
export { Input } from './components/Input';
export { Label } from './components/Label';
export { Textarea } from './components/Textarea';
export { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton
} from './components/Select';
export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from './components/Card';

// Form Components
export { FormGenerator } from './forms/FormGenerator';
export { FormField } from './forms/FormField';
export { 
  SchemaFormGenerator,
  generateSchemaFromInterface,
  createFormSchema
} from './forms/SchemaFormGenerator';

// Types
export type { 
  FormFieldConfig,
  FormSection,
  FormConfig,
  FormGeneratorProps
} from './forms/FormGenerator';
export type {
  JSONSchema,
  JSONSchemaProperty
} from './forms/SchemaFormGenerator';

// Hooks
export { useFormState } from './hooks/useFormState';
export { 
  useFormValidation,
  commonValidationRules
} from './hooks/useFormValidation';

// Types for hooks
export type { FormState, UseFormStateOptions } from './hooks/useFormState';
export type { ValidationRule, FieldValidation } from './hooks/useFormValidation';

// Utilities
export { cn } from './utils/cn';

// Styles (import in your app)
export * from './styles/globals.css';