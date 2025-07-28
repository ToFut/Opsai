"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlSchema = exports.passwordSchema = exports.emailSchema = void 0;
exports.isValidEmail = isValidEmail;
exports.isValidPassword = isValidPassword;
exports.isValidURL = isValidURL;
exports.validateRequired = validateRequired;
exports.validateMinLength = validateMinLength;
exports.validateMaxLength = validateMaxLength;
exports.validatePattern = validatePattern;
exports.validateNumber = validateNumber;
exports.validateMinValue = validateMinValue;
exports.validateMaxValue = validateMaxValue;
exports.validateDate = validateDate;
exports.validateFileSize = validateFileSize;
exports.validateFileType = validateFileType;
const zod_1 = require("zod");
exports.emailSchema = zod_1.z.string().email('Invalid email address');
exports.passwordSchema = zod_1.z.string().min(8, 'Password must be at least 8 characters');
exports.urlSchema = zod_1.z.string().url('Invalid URL');
function isValidEmail(email) {
    return exports.emailSchema.safeParse(email).success;
}
function isValidPassword(password) {
    return exports.passwordSchema.safeParse(password).success;
}
function isValidURL(url) {
    return exports.urlSchema.safeParse(url).success;
}
function validateRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
        return `${fieldName} is required`;
    }
    return null;
}
function validateMinLength(value, minLength, fieldName) {
    if (value && value.length < minLength) {
        return `${fieldName} must be at least ${minLength} characters`;
    }
    return null;
}
function validateMaxLength(value, maxLength, fieldName) {
    if (value && value.length > maxLength) {
        return `${fieldName} must be no more than ${maxLength} characters`;
    }
    return null;
}
function validatePattern(value, pattern, fieldName, message) {
    if (value && !pattern.test(value)) {
        return message || `${fieldName} format is invalid`;
    }
    return null;
}
function validateNumber(value, fieldName) {
    if (value !== null && value !== undefined && isNaN(Number(value))) {
        return `${fieldName} must be a number`;
    }
    return null;
}
function validateMinValue(value, minValue, fieldName) {
    if (value < minValue) {
        return `${fieldName} must be at least ${minValue}`;
    }
    return null;
}
function validateMaxValue(value, maxValue, fieldName) {
    if (value > maxValue) {
        return `${fieldName} must be no more than ${maxValue}`;
    }
    return null;
}
function validateDate(value, fieldName) {
    if (value && isNaN(Date.parse(value))) {
        return `${fieldName} must be a valid date`;
    }
    return null;
}
function validateFileSize(file, maxSize, fieldName) {
    if (file && file.size > maxSize) {
        return `${fieldName} must be no larger than ${formatFileSize(maxSize)}`;
    }
    return null;
}
function validateFileType(file, allowedTypes, fieldName) {
    if (file && !allowedTypes.includes(file.type)) {
        return `${fieldName} must be one of: ${allowedTypes.join(', ')}`;
    }
    return null;
}
function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
//# sourceMappingURL=validation.js.map