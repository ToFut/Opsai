import { NextRequest, NextResponse } from 'next/server'

// DEPRECATED: This route is replaced by /api/oauth/connect which uses proper Airbyte client credentials
// Use /api/oauth/connect instead for all OAuth flows

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'This endpoint is deprecated. Use /api/oauth/connect instead.',
    redirect: '/api/oauth/connect'
  }, { status: 301 })
}