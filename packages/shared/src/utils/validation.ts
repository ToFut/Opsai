import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const urlSchema = z.string().url('Invalid URL');

export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function isValidPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function isValidURL(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

export function validateRequired(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateMinLength(value: string, minLength: number, fieldName: string): string | null {
  if (value && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
}

export function validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
  if (value && value.length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters`;
  }
  return null;
}

export function validatePattern(value: string, pattern: RegExp, fieldName: string, message?: string): string | null {
  if (value && !pattern.test(value)) {
    return message || `${fieldName} format is invalid`;
  }
  return null;
}

export function validateNumber(value: any, fieldName: string): string | null {
  if (value !== null && value !== undefined && isNaN(Number(value))) {
    return `${fieldName} must be a number`;
  }
  return null;
}

export function validateMinValue(value: number, minValue: number, fieldName: string): string | null {
  if (value < minValue) {
    return `${fieldName} must be at least ${minValue}`;
  }
  return null;
}

export function validateMaxValue(value: number, maxValue: number, fieldName: string): string | null {
  if (value > maxValue) {
    return `${fieldName} must be no more than ${maxValue}`;
  }
  return null;
}

export function validateDate(value: any, fieldName: string): string | null {
  if (value && isNaN(Date.parse(value))) {
    return `${fieldName} must be a valid date`;
  }
  return null;
}

export function validateFileSize(file: File, maxSize: number, fieldName: string): string | null {
  if (file && file.size > maxSize) {
    return `${fieldName} must be no larger than ${formatFileSize(maxSize)}`;
  }
  return null;
}

export function validateFileType(file: File, allowedTypes: string[], fieldName: string): string | null {
  if (file && !allowedTypes.includes(file.type)) {
    return `${fieldName} must be one of: ${allowedTypes.join(', ')}`;
  }
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 