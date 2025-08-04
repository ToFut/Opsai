# 🚀 Deploy to Vercel for HTTPS OAuth Testing

## Quick Deploy Steps

### 1. **Install Vercel CLI** (if not already installed)
```bash
npm i -g vercel
```

### 2. **Deploy from this directory**
```bash
cd /Users/segevbin/Desktop/Opsai/apps/opsai-onboarding
vercel
```

### 3. **During deployment, Vercel will ask:**
- Project name: `opsai-onboarding` (or your choice)
- Deploy directory: `.` (current directory)
- Build command: `npm run build`
- Dev command: `npm run dev`

### 4. **After deployment, you'll get a URL like:**
```
https://opsai-onboarding-xxx.vercel.app
```

### 5. **Configure Environment Variables**
In the Vercel dashboard, add these environment variables:
```
AIRBYTE_CLIENT_ID=4af7a574-b155-47ee-8dce-2cd2c519a34a
AIRBYTE_CLIENT_SECRET=qxbgA1QsHSZBfOVqdgjbiNJ1ultXGwz7
AIRBYTE_WORKSPACE_ID=293ab9ea-b538-4a5d-940d-7eacaffda8f5
GITHUB_CLIENT_ID=Ov23lixYKPOibZXQhBWA
GITHUB_CLIENT_SECRET=8b6c7f633224ba5321610930b18f820215e79314
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

### 6. **Test the Integration**
Visit these URLs on your deployed app:
- `https://your-app.vercel.app/airbyte-simple` - Basic integration test
- `https://your-app.vercel.app/test-ui` - UI components test
- `https://your-app.vercel.app/oauth-complete-demo` - Full OAuth demo

### 7. **Test OAuth Flow**
1. Go to the OAuth demo page
2. Click "Connect GitHub"
3. Complete GitHub OAuth
4. Should automatically create Airbyte source!

## 🎯 What This Tests

✅ **HTTPS OAuth Flow**: Real GitHub OAuth with HTTPS redirect  
✅ **Airbyte Integration**: Automatic source creation after OAuth  
✅ **Token Management**: Auto-refresh of Airbyte tokens  
✅ **Production Ready**: All security features enabled  

## 🔍 Debug if Issues

If OAuth fails:
1. Check environment variables in Vercel dashboard
2. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
3. Visit `/api/test-token` to verify Airbyte connection
4. Visit `/api/airbyte/simple-debug` for full diagnostics

## 🚨 Important Notes

- **GitHub OAuth**: May need to add your Vercel URL to GitHub OAuth settings
- **HTTPS Required**: Airbyte requires HTTPS for OAuth (that's why we need Vercel)
- **Environment Variables**: Must be set in Vercel dashboard, not just .env.local

---

**Ready to test the full OAuth integration with HTTPS! 🎉**