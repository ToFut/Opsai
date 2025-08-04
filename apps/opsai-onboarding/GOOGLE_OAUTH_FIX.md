# Google OAuth Access Denied Fix

## The Issue
Google OAuth shows: "Error 403: access_denied" because your app is in testing mode and needs approved test users.

## Quick Fix - Add Test Users

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com
   - Select your project

2. **Navigate to OAuth Consent Screen**
   - APIs & Services → OAuth consent screen
   - You'll see "Publishing status: Testing"

3. **Add Test Users**
   - Scroll down to "Test users" section
   - Click "+ ADD USERS"
   - Add your Gmail addresses:
     - Your personal Gmail
     - Any team member emails
     - Test accounts
   - Click "SAVE"

4. **Alternative: Publish to Production (Optional)**
   - Click "PUBLISH APP" button
   - Note: This requires filling out more details
   - For development, test users is sufficient

## Immediate Testing Solution

While in testing mode, you can:
1. Use any email addresses you added as test users
2. Create a test Google account specifically for development
3. Add up to 100 test users without verification

## For Production

When ready for production:
1. Fill out OAuth consent screen completely
2. Submit for Google verification
3. This process can take 3-6 weeks
4. Required for >100 users

## Scopes Note

If using sensitive scopes (like Google Analytics), verification is required even for production. For development, test users bypass this requirement.

## Current Configuration

Your app requests these scopes:
- Basic profile (email, profile)
- Google Analytics (readonly)
- Google Drive (readonly)  
- Google Calendar (readonly)

These are considered "sensitive" scopes by Google.