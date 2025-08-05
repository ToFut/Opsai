import { githubClient } from './github'
import { googleClient } from './google'

export class IntegrationService {
  github: githubClient
  google: googleClient
  
  constructor() {
    this.github = new githubClient()
    this.google = new googleClient()
  }
  
  async syncAll() {
    const results = await Promise.allSettled([
      this.github.sync(),
      this.google.sync()
    ])
    
    return results.map((result, index) => ({
      provider: 'github', 'google'.split(', ')[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }))
  }
}

export const integrations = new IntegrationService()
