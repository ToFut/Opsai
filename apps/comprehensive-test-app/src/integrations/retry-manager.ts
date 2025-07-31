export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class RetryManager {
  private options: RetryOptions;

  constructor(maxRetries: number = 3) {
    this.options = {
      maxRetries,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.options.maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on the last attempt
        if (attempt > this.options.maxRetries) {
          break;
        }
        
        // Don't retry certain types of errors
        if (!this.shouldRetry(error)) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.options.baseDelay * Math.pow(this.options.backoffMultiplier, attempt - 1),
          this.options.maxDelay
        );
        
        console.warn(`Retry attempt ${attempt}/${this.options.maxRetries} after ${delay}ms delay. Error: ${lastError.message}`);
        await this.delay(delay);
      }
    }
    
    throw lastError!;
  }

  private shouldRetry(error: any): boolean {
    // Don't retry authentication errors
    if (error.name === 'AuthenticationError') return false;
    
    // Don't retry validation errors
    if (error.name === 'ValidationError') return false;
    
    // Retry network errors and 5xx server errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
    if (error.response?.status >= 500) return true;
    
    // Retry rate limit errors
    if (error.name === 'RateLimitError') return true;
    
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}