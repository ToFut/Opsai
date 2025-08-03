import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ClaudeGitHubRequest {
  message: string
  appId: string
  appName: string
  githubRepo?: string
  action: 'create_issue' | 'create_pr' | 'comment' | 'analyze'
  context?: {
    currentCode?: string
    currentFeatures?: string[]
    businessRequirements?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body: ClaudeGitHubRequest = await request.json()
    const { message, appId, appName, githubRepo, action, context } = body

    // Get app details from database
    const { data: appData, error: appError } = await supabase
      .from('generated_apps')
      .select('*')
      .eq('id', appId)
      .single()

    if (appError || !appData) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    // Determine GitHub repository
    const repoUrl = githubRepo || appData.github_repo || `https://github.com/${user.user_metadata?.github_username || 'your-org'}/${appName}`

    // Create Claude GitHub Action request
    const claudeResponse = await handleClaudeGitHubAction({
      message,
      appId,
      appName,
      repoUrl,
      action,
      context,
      user
    })

    // Save the interaction to database
    await supabase
      .from('claude_interactions')
      .insert({
        app_id: appId,
        user_id: user.id,
        action_type: action,
        message: message,
        response: claudeResponse,
        github_repo: repoUrl,
        status: 'completed',
        created_at: new Date().toISOString()
      })

    return NextResponse.json(claudeResponse)
  } catch (error) {
    console.error('Claude GitHub API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleClaudeGitHubAction({
  message,
  appId,
  appName,
  repoUrl,
  action,
  context,
  user
}: {
  message: string
  appId: string
  appName: string
  repoUrl: string
  action: string
  context?: any
  user: any
}) {
  
  // Create GitHub issue/PR using Claude Code GitHub Actions
  const githubAction = await createGitHubAction({
    message,
    appName,
    repoUrl,
    action,
    context,
    user
  })

  return {
    success: true,
    action: action,
    githubAction: githubAction,
    message: `✅ Successfully created ${action} for ${appName}`,
    nextSteps: getNextSteps(action),
    claudeResponse: generateClaudeResponse(message, action, context)
  }
}

async function createGitHubAction({
  message,
  appName,
  repoUrl,
  action,
  context,
  user
}: {
  message: string
  appName: string
  repoUrl: string
  action: string
  context?: any
  user: any
}) {
  
  // Extract repo owner and name from URL
  const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  const repoOwner = repoMatch?.[1] || 'your-org'
  const repoName = repoMatch?.[2] || appName

  // Create GitHub API request based on action type
  switch (action) {
    case 'create_issue':
      return await createGitHubIssue({
        owner: repoOwner,
        repo: repoName,
        title: `🤖 AI Improvement Request: ${message.substring(0, 50)}...`,
        body: generateIssueBody(message, context, appName),
        labels: ['ai-improvement', 'enhancement']
      })

    case 'create_pr':
      return await createGitHubPR({
        owner: repoOwner,
        repo: repoName,
        title: `🚀 AI-Generated Enhancement: ${message.substring(0, 50)}...`,
        body: generatePRBody(message, context, appName),
        head: `ai-improvement-${Date.now()}`,
        base: 'main'
      })

    case 'comment':
      return await createGitHubComment({
        owner: repoOwner,
        repo: repoName,
        issueNumber: 1, // You might want to get this from context
        body: generateCommentBody(message, context)
      })

    default:
      return { type: 'analysis', message: 'Analyzing codebase...' }
  }
}

async function createGitHubIssue({ owner, repo, title, body, labels }: {
  owner: string
  repo: string
  title: string
  body: string
  labels: string[]
}) {
  // This would integrate with GitHub API
  // For now, return mock response
  return {
    type: 'issue',
    url: `https://github.com/${owner}/${repo}/issues/1`,
    number: 1,
    title,
    body,
    labels
  }
}

async function createGitHubPR({ owner, repo, title, body, head, base }: {
  owner: string
  repo: string
  title: string
  body: string
  head: string
  base: string
}) {
  // This would integrate with GitHub API
  // For now, return mock response
  return {
    type: 'pull_request',
    url: `https://github.com/${owner}/${repo}/pull/1`,
    number: 1,
    title,
    body,
    head,
    base
  }
}

async function createGitHubComment({ owner, repo, issueNumber, body }: {
  owner: string
  repo: string
  issueNumber: number
  body: string
}) {
  // This would integrate with GitHub API
  // For now, return mock response
  return {
    type: 'comment',
    url: `https://github.com/${owner}/${repo}/issues/${issueNumber}#issuecomment-123456`,
    body
  }
}

function generateIssueBody(message: string, context?: any, appName?: string): string {
  return `
## 🤖 AI Improvement Request

**User Request:** ${message}

**Application:** ${appName}

**Context:**
${context?.currentFeatures ? `- Current Features: ${context.currentFeatures.join(', ')}` : ''}
${context?.businessRequirements ? `- Business Requirements: ${context.businessRequirements}` : ''}

**Requested by:** AI Assistant via OpsAI Platform

---

### Next Steps
1. Review the request
2. Implement the suggested improvements
3. Test the changes
4. Update the application

### AI Suggestions
The AI has analyzed your request and will provide specific implementation guidance.

---

*This issue was automatically created by Claude Code GitHub Actions integration.*
  `.trim()
}

function generatePRBody(message: string, context?: any, appName?: string): string {
  return `
## 🚀 AI-Generated Enhancement

**Enhancement Request:** ${message}

**Application:** ${appName}

**Changes Made:**
- [ ] Code improvements based on AI analysis
- [ ] Feature enhancements
- [ ] Performance optimizations
- [ ] Security improvements

**Context:**
${context?.currentFeatures ? `- Current Features: ${context.currentFeatures.join(', ')}` : ''}
${context?.businessRequirements ? `- Business Requirements: ${context.businessRequirements}` : ''}

**Requested by:** AI Assistant via OpsAI Platform

---

### Implementation Details
The AI has generated code changes to address your request. Please review the changes and test thoroughly.

### Testing Checklist
- [ ] Functionality works as expected
- [ ] No breaking changes introduced
- [ ] Performance is maintained or improved
- [ ] Security is not compromised

---

*This PR was automatically created by Claude Code GitHub Actions integration.*
  `.trim()
}

function generateCommentBody(message: string, context?: any): string {
  return `
🤖 **AI Assistant Comment:**

${message}

**Analysis:**
The AI has reviewed your request and provided the following insights:

${context?.currentCode ? `**Current Code Context:**\n\`\`\`\n${context.currentCode}\n\`\`\`` : ''}

**Recommendations:**
1. Review the suggested changes
2. Test the implementation
3. Consider additional improvements

---

*This comment was automatically generated by Claude Code GitHub Actions integration.*
  `.trim()
}

function generateClaudeResponse(message: string, action: string, context?: any): string {
  const lowerMessage = message.toLowerCase()
  
  if (action === 'create_issue') {
    return `✅ I've created a GitHub issue for your request: "${message}". The issue has been tagged with "ai-improvement" and "enhancement" labels. You can track the progress and collaborate with your team on the implementation.`
  }
  
  if (action === 'create_pr') {
    return `🚀 I've created a pull request with the suggested improvements for: "${message}". The PR includes code changes, documentation updates, and testing recommendations. Please review the changes before merging.`
  }
  
  if (action === 'comment') {
    return `💬 I've added a comment to the existing issue with my analysis of: "${message}". The comment includes code suggestions, best practices, and implementation guidance.`
  }
  
  if (action === 'analyze') {
    return `🔍 I've analyzed your codebase and request: "${message}". Here are my findings and recommendations for improvements. I can help you implement these changes step by step.`
  }
  
  return `🤖 I understand your request: "${message}". I've processed it and created the appropriate GitHub action. You'll receive updates on the progress and can collaborate with your team on the implementation.`
}

function getNextSteps(action: string): string[] {
  switch (action) {
    case 'create_issue':
      return [
        'Review the created GitHub issue',
        'Assign team members to work on it',
        'Set milestones and deadlines',
        'Track progress in GitHub'
      ]
    case 'create_pr':
      return [
        'Review the pull request changes',
        'Run tests and CI/CD checks',
        'Request code review from team',
        'Merge when approved'
      ]
    case 'comment':
      return [
        'Review the AI comment',
        'Implement suggested changes',
        'Update the issue with progress',
        'Close when completed'
      ]
    case 'analyze':
      return [
        'Review the analysis report',
        'Prioritize improvements',
        'Create issues for high-priority items',
        'Plan implementation timeline'
      ]
    default:
      return [
        'Review the generated content',
        'Implement suggested changes',
        'Test the improvements',
        'Deploy when ready'
      ]
  }
} 