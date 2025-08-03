#!/usr/bin/env node

/**
 * Test script for GitHub OAuth flow
 * Run with: node scripts/test-github-oauth.js
 */

console.log('🧪 GitHub OAuth Flow Test\n')

// Check environment variables
const requiredEnvVars = ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET']
const missingVars = requiredEnvVars.filter(v => !process.env[v])

if (missingVars.length > 0) {
  console.error('❌ Missing environment variables:', missingVars.join(', '))
  console.log('\nMake sure you have these in your .env.local:')
  console.log('GITHUB_CLIENT_ID=Ov23lixYKPOibZXQhBWA')
  console.log('GITHUB_CLIENT_SECRET=8b6c7f633224ba5321610930b18f820215e79314')
  process.exit(1)
}

console.log('✅ GitHub OAuth credentials found')
console.log(`   Client ID: ${process.env.GITHUB_CLIENT_ID}`)
console.log(`   Client Secret: ${process.env.GITHUB_CLIENT_SECRET.substring(0, 10)}...`)

// Generate OAuth URL
const state = Buffer.from(JSON.stringify({
  provider: 'github',
  tenantId: 'test-tenant-123'
})).toString('base64')

const redirectUri = 'http://localhost:7250/oauth-success'
const oauthUrl = `https://github.com/login/oauth/authorize?` +
  `client_id=${process.env.GITHUB_CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `scope=repo,user,read:org&` +
  `state=${state}`

console.log('\n📋 OAuth URL Generated:')
console.log(oauthUrl)

console.log('\n🔍 Testing Instructions:')
console.log('1. Make sure your app is running on http://localhost:7250')
console.log('2. Open the OAuth URL above in your browser')
console.log('3. Authorize the GitHub OAuth App')
console.log('4. Check the browser console for success messages')
console.log('5. Check localStorage for "oauth_success" key')

console.log('\n💡 The new flow bypasses Airbyte API and exchanges tokens directly with GitHub')
console.log('   This avoids the "Unauthorized" errors from Airbyte API')