interface GenerationRequest {
  yamlConfig: string
  appName: string
}

interface GenerationResponse {
  success: boolean
  appUrl?: string
  message?: string
  error?: string
  details?: string
}

export class OpsaiGenerator {
  private static instance: OpsaiGenerator
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3010' 
      : 'https://your-opsai-onboarding-domain.com'
  }

  static getInstance(): OpsaiGenerator {
    if (!OpsaiGenerator.instance) {
      OpsaiGenerator.instance = new OpsaiGenerator()
    }
    return OpsaiGenerator.instance
  }

  async generateApp(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      return data
    } catch (error) {
      console.error('Generation error:', error)
      return {
        success: false,
        error: 'Failed to generate application',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`)
      return response.ok
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  // Utility method to integrate with the actual OPSAI CLI in the future
  static async integrateWithCLI(yamlConfig: string, outputDir: string): Promise<string> {
    // This would be the actual integration point with OPSAI Core CLI
    // Example commands that would be executed:
    
    const commands = [
      `cd ${outputDir}`,
      `echo '${yamlConfig}' > opsai-config.yaml`,
      `opsai generate --config opsai-config.yaml`,
      `npm install`,
      `npm run build`,
      `vercel --prod` // or your preferred deployment method
    ]

    console.log('Commands that would be executed:')
    commands.forEach((cmd, index) => {
      console.log(`${index + 1}. ${cmd}`)
    })

    // Return simulated URL for now
    return `https://generated-app-${Date.now()}.vercel.app`
  }

  // Helper method to validate YAML config before generation
  static validateYAMLConfig(yamlConfig: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      // Basic validation checks
      if (!yamlConfig.trim()) {
        errors.push('YAML configuration is empty')
      }

      if (!yamlConfig.includes('metadata:')) {
        errors.push('Missing metadata section')
      }

      if (!yamlConfig.includes('database:')) {
        errors.push('Missing database section')
      }

      // Add more validation rules as needed
      const hasValidApp = yamlConfig.includes('name:') && yamlConfig.includes('displayName:')
      if (!hasValidApp) {
        errors.push('Missing required app configuration')
      }

      return {
        valid: errors.length === 0,
        errors
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`Invalid YAML format: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }
}

export const opsaiGenerator = OpsaiGenerator.getInstance()