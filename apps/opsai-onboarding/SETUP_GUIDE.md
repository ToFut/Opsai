# AI Improvement Dashboard Setup Guide

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file in the `apps/opsai-onboarding` directory:

```env
# OpenAI API Key (Required for AI code generation)
OPENAI_API_KEY=sk-your_openai_api_key_here

# GitHub Token (Required for repository access)
GITHUB_TOKEN=ghp_your_github_token_here

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:7250

# Optional: Database URL (if using database)
DATABASE_URL=your_database_url_here
```

### 2. GitHub Token Setup

1. **Go to GitHub Settings**: https://github.com/settings/tokens
2. **Generate New Token**: Click "Generate new token (classic)"
3. **Set Permissions**:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `write:packages` (Optional: for package publishing)
4. **Copy Token**: Save the token (starts with `ghp_`)
5. **Add to Environment**: Paste in your `.env.local` file

### 3. OpenAI API Key Setup

1. **Go to OpenAI**: https://platform.openai.com/api-keys
2. **Create API Key**: Click "Create new secret key"
3. **Copy Key**: Save the key (starts with `sk-`)
4. **Add to Environment**: Paste in your `.env.local` file

### 4. Start the Application

```bash
cd apps/opsai-onboarding
npm install
npm run dev
```

Access the dashboard at: `http://localhost:7250/dashboard`

## 🔗 Vercel Integration

### Automatic Deployment Flow

1. **AI Generates Code** → Creates improvements
2. **Pushes to GitHub** → Creates branch and pull request
3. **Vercel Detects Changes** → Automatically deploys
4. **Preview Available** → New version deployed to Vercel

### Vercel Project Setup

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Auto-Deploy**: Enable automatic deployments on push
3. **Preview Deployments**: Enable preview deployments for pull requests

### Environment Variables in Vercel

Add these to your Vercel project settings:

```env
OPENAI_API_KEY=sk-your_openai_api_key_here
GITHUB_TOKEN=ghp_your_github_token_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-vercel-app.vercel.app
```

## 🎯 How It Works

### 1. User Interaction
- User selects an app from the dashboard
- User chats with AI about improvements
- AI generates complete, working code

### 2. Code Generation
- AI creates TypeScript/JavaScript files
- Includes all necessary imports and dependencies
- Adds proper error handling and documentation
- Generates both frontend and backend code

### 3. Git Integration
- Clones user's repository to temporary directory
- Creates new branch: `ai-improvements-{timestamp}`
- Writes generated code to repository
- Commits changes with descriptive message
- Pushes branch to GitHub

### 4. Pull Request Creation
- Automatically creates pull request
- Includes detailed description of changes
- Links to the generated branch
- Ready for review and merge

### 5. Vercel Deployment
- Vercel detects new branch/pull request
- Automatically builds and deploys
- Creates preview URL for testing
- Ready for production deployment

## 🔧 Repository Requirements

### GitHub Repository Setup
- Repository must be accessible (public or private with token access)
- Repository URL must be in format: `https://github.com/username/repo-name`
- User must have write access to the repository

### Supported File Types
- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)
- CSS (`.css`, `.scss`)
- JSON (`.json`)
- Markdown (`.md`)
- Environment files (`.env`)

## 🛠️ Troubleshooting

### Common Issues

1. **GitHub Token Error**
   - Ensure token has correct permissions
   - Check if token is expired
   - Verify repository access

2. **Repository Access Error**
   - Check repository URL format
   - Ensure repository exists
   - Verify write permissions

3. **OpenAI API Error**
   - Check API key is valid
   - Ensure sufficient credits
   - Verify API key permissions

4. **Vercel Deployment Issues**
   - Check Vercel project settings
   - Verify environment variables
   - Check build logs

### Error Messages

- **"Repository not found"**: Check repository URL and access
- **"Authentication failed"**: Verify GitHub token
- **"API key invalid"**: Check OpenAI API key
- **"Permission denied"**: Ensure token has write permissions

## 🎉 Success Indicators

### When Everything Works
- ✅ AI generates code successfully
- ✅ Code is pushed to GitHub
- ✅ Pull request is created
- ✅ Vercel deploys automatically
- ✅ Preview URL is available

### Dashboard Features
- Real-time chat with AI
- Code preview with syntax highlighting
- Confidence and quality indicators
- One-click apply changes
- GitHub integration status

## 🔒 Security Considerations

### Token Security
- Never commit tokens to version control
- Use environment variables
- Rotate tokens regularly
- Use minimal required permissions

### Repository Security
- Review generated code before merging
- Test changes in preview environment
- Use branch protection rules
- Require pull request reviews

## 📈 Best Practices

### For Users
1. **Start Small**: Begin with simple improvements
2. **Review Code**: Always review generated code
3. **Test Changes**: Test in preview before merging
4. **Iterate**: Use AI suggestions for further improvements

### For Developers
1. **Monitor Usage**: Track API usage and costs
2. **Backup Data**: Keep backups of important repositories
3. **Version Control**: Use proper git workflow
4. **Documentation**: Document custom improvements

## 🚀 Advanced Features

### Custom Improvements
- Security enhancements
- Performance optimizations
- UI/UX improvements
- Database optimizations
- API integrations
- Authentication systems

### Integration Options
- GitHub repositories
- Vercel deployments
- Custom domains
- Environment management
- Automated testing

Happy coding! 🎉💖 