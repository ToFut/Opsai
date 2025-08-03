import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'No data provided' },
        { status: 400 }
      )
    }
    
    const changesSummary = JSON.parse(decodeURIComponent(data))
    
    // Create a zip file with all the generated code
    const zip = new JSZip()
    
    // Add each file to the zip
    changesSummary.changes.forEach((change: any) => {
      zip.file(change.file, change.content)
    })
    
    // Add a README file with instructions
    const readmeContent = `# AI-Generated Improvements

## Overview
This package contains AI-generated improvements for your application.

## Files Included
${changesSummary.changes.map((change: any) => `- ${change.file}: ${change.description}`).join('\n')}

## Instructions
1. Review each file carefully
2. Apply the changes to your repository
3. Test the functionality
4. Create a pull request with the improvements

## Branch Information
- Branch Name: ${changesSummary.branch}
- Commit Message: ${changesSummary.commitMessage}

## Generated on
${new Date().toISOString()}

Happy coding! 🚀
`
    
    zip.file('README.md', readmeContent)
    
    // Generate the zip file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    
    // Return the zip file as a download
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="ai-improvements-${Date.now()}.zip"`,
        'Content-Length': zipBuffer.length.toString()
      }
    })
    
  } catch (error) {
    console.error('Failed to create download:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create download' },
      { status: 500 }
    )
  }
} 