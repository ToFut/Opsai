# Vercel Deployment Steps

## 1. Set Environment Variables in Vercel Dashboard

Go to your Vercel project settings and add ALL environment variables from your `.env.local` file.

Required variables:
- All API keys (OpenAI, Anthropic, etc.)
- All Supabase credentials
- All OAuth client IDs and secrets
- Airbyte configuration

## 2. Deploy

```bash
vercel --prod
```

Or push to GitHub for automatic deployment.

## 3. Update OAuth Redirect URLs

After deployment, update all OAuth providers with your Vercel URL:
- `https://your-app.vercel.app/api/oauth/callback`

## 4. Update NEXT_PUBLIC_APP_URL

In Vercel dashboard, update:
- `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`

## Common Issues

- **Build errors**: Make sure ALL environment variables are set
- **OAuth errors**: Ensure redirect URLs match exactly
- **API errors**: Check API keys are valid and have quota