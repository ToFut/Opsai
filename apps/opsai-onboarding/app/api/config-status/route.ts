import { NextResponse } from 'next/server'
import { configChecker } from '@/lib/config-checker'

export async function GET() {
  return NextResponse.json({
    airbyte: configChecker.isAirbyteConfigured(),
    openai: configChecker.isOpenAIConfigured(),
    supabase: configChecker.isSupabaseConfigured(),
    oauthProviders: configChecker.getOAuthProviders(),
    missing: configChecker.getMissingConfig()
  })
}