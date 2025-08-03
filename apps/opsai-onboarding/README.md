# 🚀 OpsAI Onboarding - AI-Powered Application Development Platform

A complete full-stack application with Supabase authentication, user dashboard, and AI-powered application improvement system.

## ✨ Features

### 🔐 Authentication System
- **Supabase Integration**: Complete user authentication with email/password
- **User Management**: Sign up, sign in, sign out functionality
- **Session Management**: Automatic session handling and persistence
- **Protected Routes**: Authentication guards for all dashboard pages

### 📊 User Dashboard
- **Application Management**: Create, view, edit, and delete applications
- **Real-time Metrics**: Performance, security, and code quality scores
- **AI Insights**: Proactive improvement suggestions
- **Search & Filter**: Find applications quickly
- **Beautiful UI**: Modern, responsive design with Tailwind CSS

### 🤖 AI Improvement System
- **Smart Code Analysis**: AI-powered codebase understanding
- **Real-time Collaboration**: Multi-user editing with shared cursors
- **Performance Monitoring**: Core Web Vitals and bundle analysis
- **Security Scanning**: Vulnerability detection and fixes
- **Code Quality Assessment**: Maintainability and complexity metrics

### 🗄️ Database Schema
- **User Applications**: Complete application lifecycle management
- **AI Insights**: Stored improvement suggestions and analysis
- **Performance Metrics**: Historical performance data
- **Security Scores**: Vulnerability tracking and scoring
- **Collaboration Sessions**: Real-time collaboration data

## 🏗️ Architecture

```
apps/opsai-onboarding/
├── app/                          # Next.js 13+ App Router
│   ├── api/                      # Backend API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── applications/         # Application CRUD
│   │   └── ai-improve/           # AI improvement API
│   ├── login/                    # Login page
│   ├── signup/                   # Signup page
│   ├── dashboard/                # Main dashboard
│   └── improve/[appId]/          # AI improvement dashboard
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   │   └── AuthForm.tsx         # Login/signup form
│   └── dashboard/                # Dashboard components
│       ├── MainDashboard.tsx     # Main dashboard view
│       ├── AppCard.tsx          # Application card
│       └── CreateAppModal.tsx   # Create app modal
├── lib/                          # Utility libraries
│   └── supabase.ts              # Supabase client & helpers
└── types/                        # TypeScript type definitions
```

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- Supabase account
- PostgreSQL database

### 2. Environment Setup
Create a `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/opsai_onboarding

# AI Service Configuration (optional)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:7250
NODE_ENV=development
```

### 3. Database Setup
Run the Prisma migrations to create the database schema:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# (Optional) Seed database
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:7250`

## 📱 User Flow

### 1. Authentication
- Users visit `/` and are redirected to `/login` if not authenticated
- Sign up with email/password or sign in with existing account
- Successful authentication redirects to `/dashboard`

### 2. Dashboard
- View all user applications in a beautiful grid layout
- Create new applications with the "Create App" button
- Search and filter applications by status
- View real-time metrics for each application

### 3. AI Improvements
- Click "Improve" on any application to access the AI dashboard
- Chat with AI to request improvements
- View generated code changes and apply them
- Monitor performance, security, and code quality metrics

## 🔧 API Endpoints

### Authentication
- `GET /api/auth` - Get current user session
- `POST /api/auth` - Handle signin/signup/signout

### Applications
- `GET /api/applications` - Get user's applications
- `POST /api/applications` - Create new application
- `GET /api/applications/[id]` - Get specific application
- `PUT /api/applications/[id]` - Update application
- `DELETE /api/applications/[id]` - Delete application

### AI Improvements
- `POST /api/ai-improve` - Generate AI-powered improvements

## 🎨 UI Components

### AuthForm
Beautiful authentication form with:
- Email/password validation
- Loading states
- Error handling
- Responsive design

### MainDashboard
Complete dashboard with:
- Application grid/list view
- Search and filtering
- Real-time metrics
- Create application modal

### AppCard
Application card showing:
- Performance metrics
- Security scores
- Code quality indicators
- AI insights
- Action buttons

### AppImprovementDashboard
AI-powered improvement interface with:
- Real-time chat with AI
- Code generation and preview
- Performance analysis
- Security scanning
- Collaboration features

## 🗄️ Database Models

### User
- Basic user information
- Authentication data
- Application relationships

### Application
- Application metadata
- URLs and repositories
- Status and versioning
- Performance metrics
- Security scores
- Code quality data

### Customization
- AI-generated improvements
- Code changes
- Status tracking
- User attribution

### AIInsight
- Improvement suggestions
- Impact assessment
- Confidence scores
- Priority levels

### PerformanceMetrics
- Core Web Vitals
- Bundle analysis
- Load times
- Recommendations

### SecurityScore
- Overall security rating
- Category breakdown
- Vulnerability tracking
- Fix suggestions

### CodeQuality
- Maintainability score
- Test coverage
- Complexity metrics
- Documentation levels

## 🔒 Security Features

- **Authentication Guards**: All protected routes require authentication
- **User Isolation**: Users can only access their own applications
- **Input Validation**: All user inputs are validated
- **Error Handling**: Comprehensive error handling and logging
- **Session Management**: Secure session handling with Supabase

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
# Build image
docker build -t opsai-onboarding .

# Run container
docker run -p 7250:7250 opsai-onboarding
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/company/opsai-onboarding/issues)
- **Discussions**: [GitHub Discussions](https://github.com/company/opsai-onboarding/discussions)

---

**Built with ❤️ by the OpsAI Team** 