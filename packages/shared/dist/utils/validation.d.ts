import { z } from 'zod';
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const urlSchema: z.ZodString;
export declare function isValidEmail(email: string): boolean;
export declare function isValidPassword(password: string): boolean;
export declare function isValidURL(url: string): boolean;
export declare function validateRequired(value: any, fieldName: string): string | null;
export declare function validateMinLength(value: string, minLength: number, fieldName: string): string | null;
export declare function validateMaxLength(value: string, maxLength: number, fieldName: string): string | null;
export declare function validatePattern(value: string, pattern: RegExp, fieldName: string, message?: string): string | null;
export declare function validateNumber(value: any, fieldName: string): string | null;
export declare function validateMinValue(value: number, minValue: number, fieldName: string): string | null;
export declare function validateMaxValue(value: number, maxValue: number, fieldName: string): string | null;
export declare function validateDate(value: any, fieldName: string): string | null;
export declare function validateFileSize(file: File, maxSize: number, fieldName: string): string | null;
export declare function validateFileType(file: File, allowedTypes: string[], fieldName: string): string | null;
//# sourceMappingURL=validation.d.ts.map