import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { appId, codeChanges, branch = 'main' } = await request.json()

    if (!codeChanges || codeChanges.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No code changes provided' },
        { status: 400 }
      )
    }

    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) {
      return NextResponse.json(
        { success: false, error: 'GitHub token not configured' },
        { status: 500 }
      )
    }

    // Create a new repository for this app
    const repoName = `opsai-app-${appId}-${Date.now()}`
    const repoOwner = process.env.GITHUB_USERNAME || 'your-username'
    const newRepoUrl = `https://github.com/${repoOwner}/${repoName}`

    console.log('Creating new repository for app:', { appId, codeChanges: codeChanges.length, repoName })
    
    // Create a temporary directory for the new repository
    const tempDir = `/tmp/${repoName}`
    await fs.mkdir(tempDir, { recursive: true })

    try {
      // Create the new repository via GitHub API
      const createRepoResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: repoName,
          description: `OpsAI Generated App - ${appId}`,
          private: false,
          auto_init: false
        })
      })

      if (!createRepoResponse.ok) {
        throw new Error(`Failed to create repository: ${createRepoResponse.statusText}`)
      }

      console.log(`Created new repository: ${newRepoUrl}`)
      
      // Initialize git in the temp directory
      process.chdir(tempDir)
      await execAsync('git init')
      await execAsync('git remote add origin ' + newRepoUrl.replace('https://', `https://${githubToken}@`))
      
      // Configure git user for commits
      await execAsync('git config user.name "AI Assistant"')
      await execAsync('git config user.email "ai@opsai.com"')
      
      // Create main branch
      await execAsync(`git checkout -b main`)
      
      // Apply the code changes
      const appliedFiles: string[] = []
      
      for (const change of codeChanges) {
        const filePath = path.join(tempDir, change.file)
        const dirPath = path.dirname(filePath)
        
        // Ensure directory exists
        await fs.mkdir(dirPath, { recursive: true })
        
        // Write the file content
        await fs.writeFile(filePath, change.content, 'utf8')
        appliedFiles.push(change.file)
        
        console.log(`Applied changes to: ${change.file}`)
      }
      
      // Add all changes to git
      await execAsync('git add .')
      
      // Create commit
      const commitMessage = `AI Improvements: ${codeChanges.length} files updated\n\nApplied improvements:\n${codeChanges.map((c: { file: any; description: any }) => `- ${c.file}: ${c.description}`).join('\n')}`
      await execAsync(`git commit -m "${commitMessage}"`)
      
      // Push to repository
      await execAsync(`git push origin main`)
      
      return NextResponse.json({
        success: true,
        message: 'New app repository created and deployed! 🚀',
        repository: newRepoUrl,
        filesApplied: appliedFiles,
        commitMessage,
        details: {
          filesModified: appliedFiles.length,
          repository: newRepoUrl,
          deployment: 'Ready for Vercel deployment'
        }
      })
      
    } finally {
      // Clean up temporary directory
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch (cleanupError) {
        console.error('Failed to cleanup temp directory:', cleanupError)
      }
    }
    
  } catch (error) {
    console.error('Failed to apply changes:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to apply changes to repository',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestions: [
          'Check if the repository URL is correct',
          'Ensure you have write access to the repository',
          'Verify your GitHub token has the necessary permissions',
          'Make sure the repository exists and is accessible'
        ]
      },
      { status: 500 }
    )
  }
}

async function createPullRequest(gitRepo: string, branchName: string, baseBranch: string, commitMessage: string, githubToken?: string): Promise<string | null> {
  try {
    // Extract repository info from git URL
    const repoMatch = gitRepo.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/)
    if (!repoMatch) {
      return null
    }
    
    const [, owner, repo] = repoMatch
    const repoName = repo.replace('.git', '')
    
    // For GitHub, we can create a pull request via API
    if (gitRepo.includes('github.com')) {
      const token = githubToken || process.env.GITHUB_TOKEN
      if (!token) {
        console.log('GitHub token not available, skipping PR creation')
        return null
      }
      
      const prData = {
        title: `AI Improvements - ${new Date().toLocaleDateString()}`,
        body: `## AI-Generated Improvements 🚀\n\n${commitMessage}\n\nThis pull request contains AI-generated improvements to enhance the application.\n\n### What's Changed\n- AI-powered code generation\n- Production-ready improvements\n- Enhanced functionality\n\n### Next Steps\n1. Review the changes\n2. Test the functionality\n3. Merge when ready\n\nHappy coding! 💖`,
        head: branchName,
        base: baseBranch
      }
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prData)
      })
      
      if (response.ok) {
        const pr = await response.json()
        return pr.html_url
      } else {
        const errorData = await response.json()
        console.error('GitHub API error:', errorData)
      }
    }
    
    // For other git providers, return the branch URL
    return `${gitRepo}/tree/${branchName}`
    
  } catch (error) {
    console.error('Failed to create pull request:', error)
    return null
  }
} 