# AI Improvement Dashboard

## Overview

The AI Improvement Dashboard is a powerful feature that allows users to chat with an AI assistant to improve their applications in real-time. The dashboard provides a split-layout interface with chat on the left and live preview/code changes on the right.

## Features

### 🎯 Split Layout Design
- **Left Side**: AI Chat Interface with improvement categories
- **Right Side**: Live site preview and code changes viewer

### 🤖 AI-Powered Improvements
- **Real-time Chat**: Interactive conversation with AI assistant
- **Code Generation**: Automatic code generation based on user requests
- **Git Integration**: Direct push to repository with pull request creation
- **Multiple Categories**: Security, Features, Integrations, Database, Storage, Auth, UI/UX, Performance

### 📝 Quick Improvement Categories
- **Security**: JWT authentication, rate limiting, input validation, HTTPS, CSRF protection
- **Features**: User dashboard, notifications, file upload, API endpoints, search functionality
- **Integrations**: Stripe payments, Slack integration, email services, CRM connections, analytics
- **Database**: Indexes, query optimization, data validation, caching, backup systems
- **Storage**: File upload, CDN, image optimization, backup storage, version control
- **Authentication**: OAuth providers, 2FA, role-based access, session management, password reset
- **UI/UX**: Dark mode, responsive design, animations, form optimization, loading states
- **Performance**: Caching, image optimization, bundle size reduction, lazy loading, CDN

### 🔄 Git Integration
- **Automatic Branching**: Creates new branches for improvements
- **Pull Request Creation**: Automatically creates PRs for review
- **File Management**: Handles multiple file changes simultaneously
- **Commit Messages**: Generates descriptive commit messages

## API Endpoints

### `/api/ai-improve`
Handles AI-powered improvement requests and code generation.

**Request:**
```json
{
  "message": "Add user authentication to my app",
  "appId": "app-123",
  "appContext": "My CRM System - Contact Management, Lead Tracking"
}
```

**Response:**
```json
{
  "success": true,
  "response": "I'll help you add authentication...",
  "codeChanges": [
    {
      "file": "src/components/Auth.tsx",
      "content": "// Authentication component...",
      "type": "add",
      "description": "New authentication component"
    }
  ],
  "suggestions": ["Add password reset", "Implement OAuth"]
}
```

### `/api/apply-changes`
Applies generated code changes to the repository.

**Request:**
```json
{
  "appId": "app-123",
  "codeChanges": [...],
  "gitRepo": "https://github.com/user/my-app",
  "branch": "main"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Changes applied successfully",
  "branch": "ai-improvements-1234567890",
  "filesApplied": ["src/components/Auth.tsx"],
  "pullRequestUrl": "https://github.com/user/my-app/pull/123",
  "commitMessage": "AI Improvements: 1 files updated"
}
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# OpenAI API Key for AI-powered improvements
OPENAI_API_KEY=your_openai_api_key_here

# GitHub Token for creating pull requests (optional)
GITHUB_TOKEN=your_github_token_here

# Database URL (if using database)
DATABASE_URL=your_database_url_here

# Next.js configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:7250
```

## Usage

1. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The app will run on port 7250.

2. **Access the Dashboard**:
   Navigate to `http://localhost:7250/dashboard`

3. **Select an App**:
   Choose an app from the right panel to start improving

4. **Chat with AI**:
   - Use the quick improvement categories for common requests
   - Type custom requests in the chat input
   - Click on AI suggestions to continue the conversation

5. **Review Code Changes**:
   - Switch to the "Code Changes" tab to see generated code
   - Review the changes before applying

6. **Apply Changes**:
   - Click "Apply Changes" to push to your repository
   - A new branch and pull request will be created automatically

## Technical Implementation

### Components
- `AppImprovementDashboard`: Main dashboard component with split layout
- Chat interface with real-time messaging
- Code preview with syntax highlighting
- Git integration for repository management

### State Management
- React hooks for local state management
- Real-time chat message updates
- Code change tracking and application

### API Integration
- OpenAI GPT-4 for intelligent responses
- GitHub API for repository operations
- File system operations for code generation

## Security Considerations

- All API keys are stored securely in environment variables
- Git operations use temporary directories that are cleaned up
- Input validation and sanitization on all user inputs
- Rate limiting on API endpoints (recommended)

## Future Enhancements

- **Real-time Collaboration**: Multiple users can collaborate on improvements
- **Code Review Integration**: Automated code review and testing
- **Deployment Integration**: Direct deployment after approval
- **Analytics Dashboard**: Track improvement metrics and success rates
- **Template Library**: Pre-built improvement templates for common scenarios 