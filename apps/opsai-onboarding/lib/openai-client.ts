import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      // Create a mock client for demo purposes
      console.warn('⚠️ OPENAI_API_KEY not set - using demo mode');
      openaiClient = new OpenAI({
        apiKey: 'demo-key-for-testing',
      });
    } else {
      openaiClient = new OpenAI({
        apiKey: apiKey,
      });
    }
  }
  
  return openaiClient;
}