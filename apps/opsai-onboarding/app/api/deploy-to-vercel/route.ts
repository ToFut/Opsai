import { NextRequest, NextResponse } from 'next/server'
import { vercelClient } from '@/lib/vercel-deployment'
import { apiLogger } from '@/lib/logger'
import fs from 'fs/promises'
import path from 'path'

interface DeployRequest {
  appPath: string
  appName: string
  environmentVariables?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const body: DeployRequest = await request.json()
    const { appPath, appName, environmentVariables = {} } = body

    if (!appPath || !appName) {
      return NextResponse.json(
        { error: 'Missing required fields: appPath, appName' },
        { status: 400 }
      )
    }

    apiLogger.info(`Starting Vercel deployment for ${appName}`)

    // Check if Vercel client is configured
    if (!vercelClient) {
      return NextResponse.json(
        { error: 'Vercel integration not configured. Please add VERCEL_TOKEN to environment variables.' },
        { status: 500 }
      )
    }

    // Read all files from the app directory
    const files = await collectFiles(appPath)
    apiLogger.info(`Collected ${files.length} files for deployment`)

    // Create deployment
    const deployment = await vercelClient.createDeployment({
      name: appName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      files: files.map(({ relativePath, content }) => ({
        file: relativePath,
        data: content,
      })),
      projectSettings: {
        framework: 'nextjs',
        buildCommand: 'npm run build',
        outputDirectory: '.next',
        installCommand: 'npm install',
        devCommand: 'npm run dev',
      },
      env: environmentVariables,
      buildEnv: {
        ...environmentVariables,
        NEXT_PUBLIC_APP_URL: `https://${appName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.vercel.app`,
      },
    })

    apiLogger.info(`✅ Deployment successful: ${deployment.url}`)

    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment.id,
        url: deployment.url,
        state: deployment.state,
        createdAt: deployment.createdAt,
      },
      projectUrl: `https://${appName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.vercel.app`,
      dashboardUrl: `https://vercel.com/dashboard/project/${appName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`,
    })
  } catch (error) {
    apiLogger.error('Vercel deployment error:', error)
    return NextResponse.json(
      { 
        error: 'Deployment failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

async function collectFiles(
  dir: string,
  baseDir: string = dir
): Promise<Array<{ relativePath: string; content: string }>> {
  const files: Array<{ relativePath: string; content: string }> = []
  
  // Files/directories to ignore
  const ignore = [
    'node_modules',
    '.next',
    '.git',
    '.env',
    '.env.local',
    'dist',
    'build',
    '.DS_Store',
    'Thumbs.db',
  ]

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (ignore.includes(entry.name)) continue

      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        // Recursively collect files from subdirectories
        const subFiles = await collectFiles(fullPath, baseDir)
        files.push(...subFiles)
      } else if (entry.isFile()) {
        // Read file content
        const content = await fs.readFile(fullPath, 'utf-8')
        const relativePath = path.relative(baseDir, fullPath)
        
        files.push({
          relativePath: relativePath.replace(/\\/g, '/'), // Ensure forward slashes
          content,
        })
      }
    }
  } catch (error) {
    apiLogger.error(`Error reading directory ${dir}:`, error)
    throw error
  }

  return files
}