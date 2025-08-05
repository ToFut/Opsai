import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }
  
  return openaiClient;
}