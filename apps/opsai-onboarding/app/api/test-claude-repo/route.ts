import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, specificFile } = await request.json()
    
    // Test 1: Can Claude access GitHub repositories directly?
    const claudePrompt = `Can you access and analyze this GitHub repository: ${repoUrl}?

Specifically, I want to know about the file: ${specificFile}

Please tell me:
1. What type of project this is
2. What technologies are used
3. What insurance carriers are mentioned or integrated
4. The main structure and features

If you can access the repository, provide detailed analysis. If you cannot access it directly, please say "Cannot access repository directly" and explain what you would need to analyze it.`

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{ role: 'user', content: claudePrompt }]
    })

    // Test 2: Compare with OpenAI approach (fetch file first)
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    let fileContent = ''
    let comparisonResult = ''
    
    if (match) {
      const [, owner, repo] = match
      const repoName = repo.replace('.git', '')
      
      try {
        const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${specificFile}`)
        if (fileResponse.ok) {
          const fileData = await fileResponse.json()
          fileContent = Buffer.from(fileData.content, 'base64').toString('utf8')
          
          // Test Claude with actual file content
          const claudeWithContent = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [{ 
              role: 'user', 
              content: `Analyze this React code and tell me about insurance carriers:\n\n${fileContent.substring(0, 2000)}...` 
            }]
          })
          
          comparisonResult = claudeWithContent.content[0].type === 'text' ? claudeWithContent.content[0].text : ''
        }
      } catch (error) {
        fileContent = 'Error fetching file'
      }
    }

    return NextResponse.json({
      success: true,
      claudeDirectAccess: {
        prompt: claudePrompt,
        response: claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : ''
      },
      claudeWithFileContent: {
        fileContent: fileContent.substring(0, 500) + '...',
        response: comparisonResult
      }
    })
    
  } catch (error) {
    console.error('Claude test failed:', error)
    return NextResponse.json(
      { success: false, error: 'Claude test failed' },
      { status: 500 }
    )
  }
} 