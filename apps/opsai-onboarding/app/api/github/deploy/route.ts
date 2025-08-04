import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthRequest } from '@/lib/auth-middleware'

interface GitHubDeployRequest {
  appId: string
  files: any[]
  config: {
    repositoryName: string
    isPrivate: boolean
    deploymentPlatform: 'vercel' | 'netlify' | 'github-pages'
    customDomain?: string
    environmentVariables?: Record<string, string>
  }
}

// GitHub API configuration
const GITHUB_API_URL = 'https://api.github.com'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export async function POST(request: NextRequest) {
  return requireAuth(request, async (authRequest: AuthRequest) => {
    try {
      const body: GitHubDeployRequest = await request.json()
      const { appId, files, config } = body
      
      if (!GITHUB_TOKEN) {
        return NextResponse.json(
          { error: 'GitHub integration not configured' },
          { status: 500 }
        )
      }
      
      console.log(`🚀 Starting GitHub deployment for app ${appId}`)
      
      // Step 1: Create GitHub repository
      const repoResponse = await createGitHubRepository(
        config.repositoryName,
        config.isPrivate,
        authRequest.user!.email
      )
      
      if (!repoResponse.success) {
        throw new Error(repoResponse.error)
      }
      
      const repository = repoResponse.data
      
      // Step 2: Create and push files to repository
      const filesResponse = await pushFilesToRepository(
        repository.full_name,
        files,
        authRequest.user!.email
      )
      
      if (!filesResponse.success) {
        throw new Error(filesResponse.error)
      }
      
      // Step 3: Set up GitHub Actions workflow
      const workflowResponse = await createDeploymentWorkflow(
        repository.full_name,
        config.deploymentPlatform,
        config.environmentVariables
      )
      
      if (!workflowResponse.success) {
        throw new Error(workflowResponse.error)
      }
      
      // Step 4: Trigger initial deployment
      const deploymentResponse = await triggerDeployment(
        repository.full_name,
        'main'
      )
      
      const result = {
        success: true,
        repository: {
          name: repository.name,
          fullName: repository.full_name,
          url: repository.html_url,
          clone_url: repository.clone_url
        },
        deployment: {
          platform: config.deploymentPlatform,
          url: deploymentResponse.deploymentUrl,
          status: 'deploying',
          workflowUrl: `${repository.html_url}/actions`
        },
        nextSteps: [
          'Repository created successfully',
          'GitHub Actions workflow configured',
          'Initial deployment triggered',
          'Monitor deployment progress in Actions tab',
          'Your app will be live shortly'
        ]
      }
      
      console.log(`✅ GitHub deployment initiated: ${repository.html_url}`)
      
      return NextResponse.json(result)
      
    } catch (error) {
      console.error('GitHub deployment failed:', error)
      
      return NextResponse.json({
        success: false,
        error: 'GitHub deployment failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        troubleshooting: [
          'Check GitHub token permissions',
          'Verify repository name is available',
          'Ensure deployment platform credentials are set',
          'Check rate limits'
        ]
      }, { status: 500 })
    }
  })
}

async function createGitHubRepository(name: string, isPrivate: boolean, userEmail: string) {
  try {
    const response = await fetch(`${GITHUB_API_URL}/user/repos`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'OpsAI-Platform'
      },
      body: JSON.stringify({
        name,
        description: `AI-generated application created with OpsAI`,
        private: isPrivate,
        auto_init: true,
        gitignore_template: 'Node',
        license_template: 'mit'
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create repository')
    }
    
    const repository = await response.json()
    return { success: true, data: repository }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Repository creation failed' 
    }
  }
}

async function pushFilesToRepository(repoFullName: string, files: any[], userEmail: string) {
  try {
    // Get the default branch SHA
    const branchResponse = await fetch(`${GITHUB_API_URL}/repos/${repoFullName}/git/refs/heads/main`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!branchResponse.ok) {
      throw new Error('Failed to get branch reference')
    }
    
    const branchData = await branchResponse.json()
    const baseSha = branchData.object.sha
    
    // Create blobs for all files
    const fileBlobs = []
    
    for (const file of files) {
      if (file.type === 'file' && file.content) {
        const blobResponse = await fetch(`${GITHUB_API_URL}/repos/${repoFullName}/git/blobs`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8'
          })
        })
        
        if (!blobResponse.ok) {
          throw new Error(`Failed to create blob for ${file.path}`)
        }
        
        const blob = await blobResponse.json()
        fileBlobs.push({
          path: file.path.startsWith('/') ? file.path.slice(1) : file.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha
        })
      }
    }
    
    // Create tree
    const treeResponse = await fetch(`${GITHUB_API_URL}/repos/${repoFullName}/git/trees`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base_tree: baseSha,
        tree: fileBlobs
      })
    })
    
    if (!treeResponse.ok) {
      throw new Error('Failed to create tree')
    }
    
    const tree = await treeResponse.json()
    
    // Create commit
    const commitResponse = await fetch(`${GITHUB_API_URL}/repos/${repoFullName}/git/commits`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Initial commit: AI-generated application',
        tree: tree.sha,
        parents: [baseSha],
        author: {
          name: 'OpsAI Platform',
          email: userEmail,
          date: new Date().toISOString()
        }
      })
    })
    
    if (!commitResponse.ok) {
      throw new Error('Failed to create commit')
    }
    
    const commit = await commitResponse.json()
    
    // Update reference
    const refResponse = await fetch(`${GITHUB_API_URL}/repos/${repoFullName}/git/refs/heads/main`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sha: commit.sha
      })
    })
    
    if (!refResponse.ok) {
      throw new Error('Failed to update reference')
    }
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'File push failed' 
    }
  }
}

async function createDeploymentWorkflow(
  repoFullName: string,
  platform: string,
  envVars?: Record<string, string>
) {
  try {
    const workflowContent = generateWorkflowContent(platform, envVars)
    
    // Create .github/workflows directory and workflow file
    const response = await fetch(`${GITHUB_API_URL}/repos/${repoFullName}/contents/.github/workflows/deploy.yml`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Add deployment workflow',
        content: Buffer.from(workflowContent).toString('base64')
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create workflow')
    }
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Workflow creation failed' 
    }
  }
}

function generateWorkflowContent(platform: string, envVars?: Record<string, string>): string {
  const envVarSection = envVars && Object.keys(envVars).length > 0 
    ? `
      env:
${Object.entries(envVars).map(([key, value]) => `        ${key}: \${{ secrets.${key} }}`).join('\n')}`
    : ''

  switch (platform) {
    case 'vercel':
      return `name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest${envVarSection}
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Vercel
      uses: vercel/action@v1
      with:
        vercel-token: \${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
`

    case 'netlify':
      return `name: Deploy to Netlify

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest${envVarSection}
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Netlify
      uses: netlify/actions/cli@master
      with:
        args: deploy --prod --dir=build
      env:
        NETLIFY_SITE_ID: \${{ secrets.NETLIFY_SITE_ID }}
        NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}
`

    case 'github-pages':
      return `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest${envVarSection}
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Setup Pages
      uses: actions/configure-pages@v3
    
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v2
      with:
        path: './build'
  
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v2
`

    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

async function triggerDeployment(repoFullName: string, branch: string) {
  try {
    // Trigger workflow by creating a deployment
    const response = await fetch(`${GITHUB_API_URL}/repos/${repoFullName}/actions/workflows/deploy.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: branch
      })
    })
    
    // Note: GitHub Actions dispatch returns 204 No Content on success
    if (response.status !== 204 && !response.ok) {
      throw new Error('Failed to trigger deployment')
    }
    
    return { 
      success: true, 
      deploymentUrl: `https://${repoFullName.split('/')[1]}.github.io` // Default for GitHub Pages
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Deployment trigger failed' 
    }
  }
}