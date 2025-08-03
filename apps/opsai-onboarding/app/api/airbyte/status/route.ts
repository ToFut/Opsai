import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const status = {
    environment: {
      AIRBYTE_API_URL: process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1',
      AIRBYTE_API_KEY: process.env.AIRBYTE_API_KEY ? 'Set' : 'NOT SET',
      AIRBYTE_WORKSPACE_ID: process.env.AIRBYTE_WORKSPACE_ID || 'NOT SET',
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'Set' : 'NOT SET',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 'Set' : 'NOT SET'
    },
    urls: {
      setupPage: 'http://localhost:7250/airbyte-setup',
      debugPage: 'http://localhost:7250/debug-airbyte',
      testApi: 'http://localhost:7250/api/airbyte/test'
    },
    troubleshooting: [
      'Check server console for detailed error logs',
      'Verify Airbyte API key is still valid',
      'Make sure .env.local is loaded (restart server after changes)',
      'API key format: Bearer token from Airbyte Cloud'
    ]
  }

  return NextResponse.json(status)
}