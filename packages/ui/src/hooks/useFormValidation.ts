import { useCallback } from 'react';
import { z } from 'zod';

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface FieldValidation {
  [fieldName: string]: ValidationRule;
}

export function useFormValidation() {
  const validateField = useCallback((value: any, rules: ValidationRule): string | null => {
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return 'This field is required';
    }

    if (value && typeof value === 'string') {
      if (rules.min && value.length < rules.min) {
        return `Must be at least ${rules.min} characters`;
      }

      if (rules.max && value.length > rules.max) {
        return `Must be no more than ${rules.max} characters`;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return 'Invalid format';
      }

      if (rules.email && !z.string().email().safeParse(value).success) {
        return 'Invalid email address';
      }

      if (rules.url && !z.string().url().safeParse(value).success) {
        return 'Invalid URL';
      }
    }

    if (typeof value === 'number') {
      if (rules.min && value < rules.min) {
        return `Must be at least ${rules.min}`;
      }

      if (rules.max && value > rules.max) {
        return `Must be no more than ${rules.max}`;
      }
    }

    if (rules.custom) {
      const result = rules.custom(value);
      if (typeof result === 'string') {
        return result;
      }
      if (result === false) {
        return 'Invalid value';
      }
    }

    return null;
  }, []);

  const validateForm = useCallback((
    data: Record<string, any>, 
    validation: FieldValidation
  ): Record<string, string> => {
    const errors: Record<string, string> = {};

    Object.entries(validation).forEach(([fieldName, rules]) => {
      const error = validateField(data[fieldName], rules);
      if (error) {
        errors[fieldName] = error;
      }
    });

    return errors;
  }, [validateField]);

  const createZodSchema = useCallback((validation: FieldValidation): z.ZodObject<any> => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    Object.entries(validation).forEach(([fieldName, rules]) => {
      let schema: z.ZodTypeAny = z.any();

      // Determine base type
      if (rules.email) {
        schema = z.string().email('Invalid email address');
      } else if (rules.url) {
        schema = z.string().url('Invalid URL');
      } else if (rules.pattern) {
        schema = z.string().regex(rules.pattern, 'Invalid format');
      } else {
        schema = z.string();
      }

      // Add length validation for strings
      if (schema instanceof z.ZodString) {
        if (rules.min) {
          schema = schema.min(rules.min, `Must be at least ${rules.min} characters`);
        }
        if (rules.max) {
          schema = schema.max(rules.max, `Must be no more than ${rules.max} characters`);
        }
      }

      // Add custom validation
      if (rules.custom) {
        schema = schema.refine(rules.custom, { message: 'Invalid value' });
      }

      // Make optional if not required
      if (!rules.required) {
        schema = schema.optional();
      }

      schemaFields[fieldName] = schema;
    });

    return z.object(schemaFields);
  }, []);

  return {
    validateField,
    validateForm,
    createZodSchema
  };
}

// Common validation rules
export const commonValidationRules = {
  email: { required: true, email: true },
  password: { 
    required: true, 
    min: 8, 
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/ 
  },
  phone: { 
    pattern: /^\+?[\d\s\-\(\)]+$/ 
  },
  url: { url: true },
  required: { required: true },
  numeric: { 
    custom: (value: any) => !isNaN(Number(value)) || 'Must be a number' 
  },
  positiveNumber: { 
    custom: (value: any) => (!isNaN(Number(value)) && Number(value) > 0) || 'Must be a positive number' 
  },
  date: {
    custom: (value: any) => !isNaN(Date.parse(value)) || 'Invalid date'
  }
};