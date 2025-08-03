import { useState, useCallback } from 'react';

interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'multi';
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface AIResponse {
  content: string;
  confidence: number;
  sources?: string[];
  reasoning?: string;
  metadata?: any;
}

interface StreamingResponse {
  content: string;
  isComplete: boolean;
  error?: string;
}

export const useAIProvider = (config: AIProviderConfig = { provider: 'openai' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const generateResponse = useCallback(async (
    prompt: string,
    options?: Partial<AIProviderConfig>
  ): Promise<AIResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt,
          provider: options?.provider || config.provider,
          model: options?.model || config.model || 'gpt-4',
          temperature: options?.temperature || config.temperature || 0.3,
          maxTokens: options?.maxTokens || config.maxTokens || 1000
        })
      });
      
      if (!response.ok) {
        throw new Error(`AI request failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return {
        content: result.content,
        confidence: result.confidence || 0.8,
        sources: result.sources || [],
        reasoning: result.reasoning,
        metadata: result.metadata
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI request failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [config]);
  
  const streamResponse = useCallback(async function* (
    prompt: string,
    options?: Partial<AIProviderConfig>
  ): AsyncGenerator<StreamingResponse> {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt,
          provider: options?.provider || config.provider,
          model: options?.model || config.model || 'gpt-4',
          temperature: options?.temperature || config.temperature || 0.3,
          maxTokens: options?.maxTokens || config.maxTokens || 1000,
          stream: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`AI stream failed: ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }
      
      let accumulatedContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          yield {
            content: accumulatedContent,
            isComplete: true
          };
          break;
        }
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulatedContent += data.content;
                yield {
                  content: accumulatedContent,
                  isComplete: false
                };
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming chunk:', parseError);
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI stream failed';
      setError(errorMessage);
      yield {
        content: '',
        isComplete: true,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [config]);
  
  const generateInsights = useCallback(async (
    data: any,
    context?: any
  ): Promise<AIResponse> => {
    const prompt = `
Analyze the following data and provide business insights:

Data: ${JSON.stringify(data)}
Context: ${JSON.stringify(context || {})}

Please provide:
1. Key patterns and trends
2. Anomalies or unusual behavior
3. Business opportunities
4. Risks or concerns
5. Actionable recommendations

Format the response as JSON with insights array.
`;
    
    return generateResponse(prompt);
  }, [generateResponse]);
  
  const analyzeMetrics = useCallback(async (
    metrics: any[],
    timeRange?: string
  ): Promise<AIResponse> => {
    const prompt = `
Analyze these business metrics for insights:

Metrics: ${JSON.stringify(metrics)}
Time Range: ${timeRange || 'current period'}

Provide:
1. Performance analysis
2. Trend identification
3. Benchmark comparisons
4. Improvement suggestions
5. Forecast predictions

Format as JSON with analysis sections.
`;
    
    return generateResponse(prompt);
  }, [generateResponse]);
  
  return {
    generateResponse,
    streamResponse,
    generateInsights,
    analyzeMetrics,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};