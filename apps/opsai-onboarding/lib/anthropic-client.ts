import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization to avoid build-time errors
let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable is not set');
    }
    
    anthropicClient = new Anthropic({
      apiKey: apiKey,
    });
  }
  
  return anthropicClient;
}