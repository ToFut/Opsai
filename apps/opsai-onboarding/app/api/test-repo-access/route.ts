import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, files } = await request.json()
    
    // Test 1: Send repository URL directly
    const testPrompt1 = `Can you access and read files from this GitHub repository: ${repoUrl}?
    
    If yes, please tell me:
    1. What type of project this is
    2. What technologies are used
    3. The main structure of the codebase
    
    If you cannot access it, please say "Cannot access repository directly"`
    
    const response1 = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: testPrompt1 }],
      max_tokens: 500,
    })
    
    // Test 2: Send specific file URLs
    let testPrompt2 = `I have these files from a GitHub repository:\n\n`
    
    if (files && files.length > 0) {
      files.forEach((file: string) => {
        testPrompt2 += `File: ${file}\n`
      })
      testPrompt2 += `\nCan you analyze these files and tell me what this project is about?`
    } else {
      testPrompt2 += `Repository: ${repoUrl}\n\nCan you tell me what this repository contains?`
    }
    
    const response2 = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: testPrompt2 }],
      max_tokens: 500,
    })
    
    return NextResponse.json({
      success: true,
      test1: {
        prompt: testPrompt1,
        response: response1.choices[0]?.message?.content
      },
      test2: {
        prompt: testPrompt2,
        response: response2.choices[0]?.message?.content
      }
    })
    
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json(
      { success: false, error: 'Test failed' },
      { status: 500 }
    )
  }
} 