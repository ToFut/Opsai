import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const { appId } = params
    
    // Get app build status (mocked for demo)
    const app = {
      id: appId,
      status: 'ready',
      buildStatus: 'completed',
      deploymentUrl: `https://${appId}.vercel.app`,
      createdAt: new Date().toISOString(),
      localPath: `/tmp/apps/${appId}`
    }
    
    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      )
    }
    
    // Simulate build progress
    const currentTime = Date.now()
    const buildStartTime = new Date(app.createdAt).getTime()
    const elapsed = currentTime - buildStartTime
    
    // Build stages and their timing
    const buildStages = [
      { name: 'Installing dependencies', duration: 5000 },
      { name: 'Building frontend assets', duration: 10000 },
      { name: 'Compiling TypeScript', duration: 15000 },
      { name: 'Running tests', duration: 20000 },
      { name: 'Optimizing production build', duration: 25000 },
      { name: 'Build complete', duration: 30000 }
    ]
    
    // Determine current stage
    let currentStage = 'initializing'
    let progress = 0
    const logs = [`[${new Date(app.createdAt).toISOString()}] Build started...`]
    
    for (const stage of buildStages) {
      if (elapsed > stage.duration) {
        logs.push(`[${new Date(buildStartTime + stage.duration).toISOString()}] ✓ ${stage.name}`)
        progress = Math.min(100, (buildStages.indexOf(stage) + 1) / buildStages.length * 100)
        currentStage = stage.name
      }
    }
    
    // Determine status
    let status = 'building'
    let testResults = null
    
    if (elapsed > 30000) {
      status = 'ready'
      testResults = {
        total: 24,
        passed: 24,
        failed: 0,
        skipped: 0,
        duration: '8.3s'
      }
      
      // Update app status if needed
      if (app.status !== 'completed') {
        // Update app status (mocked)
        console.log('App status updated for', appId)
      }
    }
    
    return NextResponse.json({
      id: app.id,
      status,
      progress,
      currentStage,
      logs,
      testResults,
      buildTime: Math.floor(elapsed / 1000),
      appPath: app.localPath,
      metadata: {
        framework: 'Next.js 14',
        nodeVersion: '18.x',
        packageManager: 'npm'
      }
    })
    
  } catch (error) {
    console.error('Get build status error:', error)
    return NextResponse.json(
      { error: 'Failed to get build status' },
      { status: 500 }
    )
  }
}