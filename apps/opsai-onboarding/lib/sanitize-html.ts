// Safe HTML sanitization to prevent XSS attacks

// Escape HTML special characters
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  
  return text.replace(/[&<>"'/]/g, (char) => map[char])
}

// Safe markdown-like formatting
export function formatMarkdownSafely(content: string): string {
  // First escape all HTML to prevent XSS
  let safe = escapeHtml(content)
  
  // Then apply safe formatting
  safe = safe
    // Bold: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text* -> <em>text</em>  
    .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>')
    // Code: `text` -> <code>text</code>
    .replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>')
    // Line breaks
    .replace(/\n/g, '<br>')
    
  return safe
}

// Sanitize user input for display
export function sanitizeUserInput(input: string): string {
  // Remove any potential script tags or dangerous content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
}

// Create safe React elements from markdown
export function createSafeMarkdownElement(content: string): {
  __html: string
} {
  return {
    __html: formatMarkdownSafely(sanitizeUserInput(content))
  }
}