import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, specificFile } = await request.json()
    
    // Extract owner and repo from GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Invalid GitHub URL' },
        { status: 400 }
      )
    }
    
    const [, owner, repo] = match
    const repoName = repo.replace('.git', '')
    
    // Fetch the specific file content from GitHub
    let fileContent = ''
    try {
      const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${specificFile}`)
      if (fileResponse.ok) {
        const fileData = await fileResponse.json()
        fileContent = Buffer.from(fileData.content, 'base64').toString('utf8')
      } else {
        fileContent = 'File not found or not accessible'
      }
    } catch (error) {
      fileContent = 'Error fetching file content'
    }
    
    // Now analyze the actual file content with OpenAI
    const analysisPrompt = `Analyze this React application code and provide insurance carrier insights:

${fileContent}

Based on this code analysis, please tell me:

1. What insurance carriers are currently being used or referenced in this application?
2. What carriers would be best for commercial insurance pricing?
3. What are the current carrier integrations and API connections visible in the code?
4. What improvements could be made for better commercial insurance coverage?

Focus on finding carrier names, API endpoints, integration patterns, and insurance-related functionality.`

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: analysisPrompt }],
      max_tokens: 1000,
      temperature: 0.3,
    })

    // Get specific carrier recommendations
    const carrierPrompt = `For commercial insurance, what are the top 10 carriers that should be integrated for best pricing and coverage?

Focus on:
- Commercial Auto
- General Liability
- Workers Compensation
- Property Insurance
- Professional Liability

Provide specific recommendations with reasoning and typical pricing advantages.`

    const carrierResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: carrierPrompt }],
      max_tokens: 800,
      temperature: 0.3,
    })

    return NextResponse.json({
      success: true,
      fileContent: fileContent.substring(0, 500) + '...', // Show first 500 chars
      repositoryAnalysis: {
        prompt: analysisPrompt.substring(0, 200) + '...', // Show truncated prompt
        response: response.choices[0]?.message?.content
      },
      carrierRecommendations: {
        prompt: carrierPrompt,
        response: carrierResponse.choices[0]?.message?.content
      }
    })
    
  } catch (error) {
    console.error('Analysis failed:', error)
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    )
  }
} 