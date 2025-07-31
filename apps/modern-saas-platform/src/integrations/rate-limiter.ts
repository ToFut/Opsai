export class RateLimiter {
  private requests: number[] = [];
  private requestsPerMinute: number;

  constructor(requestsPerMinute: number = 60) {
    this.requestsPerMinute = requestsPerMinute;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old requests
    this.requests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);

    // Check if we can make a request
    if (this.requests.length >= this.requestsPerMinute) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = oldestRequest + 60000 - now;
      
      if (waitTime > 0) {
        await this.delay(waitTime);
        return this.acquire(); // Recursive call after waiting
      }
    }

    // Record this request
    this.requests.push(now);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);
    return Math.max(0, this.requestsPerMinute - recentRequests.length);
  }
}