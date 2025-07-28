export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toTitleCaseString(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

export function toCamelCase(str: string): string {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
}

export function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function toSnakeCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

export function toPascalCase(str: string): string {
  return str.replace(/(^|[-_\s]+)(.)/g, (_, __, c) => c.toUpperCase());
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(str: string, length: number, suffix: string = '...'): string {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
}

export function truncateWords(str: string, wordCount: number, suffix: string = '...'): string {
  const words = str.split(' ');
  if (words.length <= wordCount) return str;
  return words.slice(0, wordCount).join(' ') + suffix;
}

export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function generateRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRandomId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${prefix}${timestamp}${random}`;
}

export function escapeHtml(str: string): string {
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

export function unescapeHtml(str: string): string {
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

export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

export function countWords(str: string): number {
  return str.trim().split(/\s+/).length;
}

export function countCharacters(str: string): number {
  return str.length;
}

export function countLines(str: string): number {
  return str.split('\n').length;
}

export function reverse(str: string): string {
  return str.split('').reverse().join('');
}

export function isPalindrome(str: string): boolean {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === reverse(cleaned);
}

export function findLongestWord(str: string): string {
  const words = str.split(/\s+/);
  return words.reduce((longest, current) => 
    current.length > longest.length ? current : longest, '');
}

export function findShortestWord(str: string): string {
  const words = str.split(/\s+/);
  return words.reduce((shortest, current) => 
    current.length < shortest.length ? current : shortest, words[0] || '');
}

export function repeat(str: string, count: number): string {
  return str.repeat(count);
}

export function padStart(str: string, length: number, char: string = ' '): string {
  return str.padStart(length, char);
}

export function padEnd(str: string, length: number, char: string = ' '): string {
  return str.padEnd(length, char);
}

export function contains(str: string, substring: string, caseSensitive: boolean = true): boolean {
  if (caseSensitive) {
    return str.includes(substring);
  }
  return str.toLowerCase().includes(substring.toLowerCase());
}

export function startsWith(str: string, prefix: string, caseSensitive: boolean = true): boolean {
  if (caseSensitive) {
    return str.startsWith(prefix);
  }
  return str.toLowerCase().startsWith(prefix.toLowerCase());
}

export function endsWith(str: string, suffix: string, caseSensitive: boolean = true): boolean {
  if (caseSensitive) {
    return str.endsWith(suffix);
  }
  return str.toLowerCase().endsWith(suffix.toLowerCase());
} 