"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capitalize = capitalize;
exports.toTitleCaseString = toTitleCaseString;
exports.toCamelCase = toCamelCase;
exports.toKebabCase = toKebabCase;
exports.toSnakeCase = toSnakeCase;
exports.toPascalCase = toPascalCase;
exports.slugify = slugify;
exports.truncate = truncate;
exports.truncateWords = truncateWords;
exports.removeAccents = removeAccents;
exports.generateRandomString = generateRandomString;
exports.generateRandomId = generateRandomId;
exports.escapeHtml = escapeHtml;
exports.unescapeHtml = unescapeHtml;
exports.stripHtml = stripHtml;
exports.countWords = countWords;
exports.countCharacters = countCharacters;
exports.countLines = countLines;
exports.reverse = reverse;
exports.isPalindrome = isPalindrome;
exports.findLongestWord = findLongestWord;
exports.findShortestWord = findShortestWord;
exports.repeat = repeat;
exports.padStart = padStart;
exports.padEnd = padEnd;
exports.contains = contains;
exports.startsWith = startsWith;
exports.endsWith = endsWith;
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function toTitleCaseString(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
function toCamelCase(str) {
    return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
}
function toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
function toSnakeCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}
function toPascalCase(str) {
    return str.replace(/(^|[-_\s]+)(.)/g, (_, __, c) => c.toUpperCase());
}
function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function truncate(str, length, suffix = '...') {
    if (str.length <= length)
        return str;
    return str.substring(0, length - suffix.length) + suffix;
}
function truncateWords(str, wordCount, suffix = '...') {
    const words = str.split(' ');
    if (words.length <= wordCount)
        return str;
    return words.slice(0, wordCount).join(' ') + suffix;
}
function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function generateRandomId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${prefix}${timestamp}${random}`;
}
function escapeHtml(str) {
    // Note: This function requires DOM environment
    // const div = document.createElement('div');
    // div.textContent = str;
    // return div.innerHTML;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function unescapeHtml(str) {
    // Note: This function requires DOM environment
    // const div = document.createElement('div');
    // div.innerHTML = str;
    // return div.textContent || div.innerText || '';
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}
function stripHtml(str) {
    return str.replace(/<[^>]*>/g, '');
}
function countWords(str) {
    return str.trim().split(/\s+/).length;
}
function countCharacters(str) {
    return str.length;
}
function countLines(str) {
    return str.split('\n').length;
}
function reverse(str) {
    return str.split('').reverse().join('');
}
function isPalindrome(str) {
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === reverse(cleaned);
}
function findLongestWord(str) {
    const words = str.split(/\s+/);
    return words.reduce((longest, current) => current.length > longest.length ? current : longest, '');
}
function findShortestWord(str) {
    const words = str.split(/\s+/);
    return words.reduce((shortest, current) => current.length < shortest.length ? current : shortest, words[0] || '');
}
function repeat(str, count) {
    return str.repeat(count);
}
function padStart(str, length, char = ' ') {
    return str.padStart(length, char);
}
function padEnd(str, length, char = ' ') {
    return str.padEnd(length, char);
}
function contains(str, substring, caseSensitive = true) {
    if (caseSensitive) {
        return str.includes(substring);
    }
    return str.toLowerCase().includes(substring.toLowerCase());
}
function startsWith(str, prefix, caseSensitive = true) {
    if (caseSensitive) {
        return str.startsWith(prefix);
    }
    return str.toLowerCase().startsWith(prefix.toLowerCase());
}
function endsWith(str, suffix, caseSensitive = true) {
    if (caseSensitive) {
        return str.endsWith(suffix);
    }
    return str.toLowerCase().endsWith(suffix.toLowerCase());
}
//# sourceMappingURL=string.js.map