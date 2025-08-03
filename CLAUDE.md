# 🤖 Claude Configuration for OpsAI Platform

This file configures Claude's behavior when working with the OpsAI platform and generated applications.

## 🎯 Project Overview

OpsAI is a SaaS platform that generates business applications based on YAML configurations. The platform includes:
- Application generation from YAML specs
- Multi-tenant architecture
- AI-powered improvements
- GitHub integration
- Deployment automation

## 📋 Code Standards

### General Guidelines
- Use TypeScript for all new code
- Follow React functional component patterns
- Use Tailwind CSS for styling
- Implement proper error handling
- Add comprehensive comments
- Write unit tests for new features

### File Structure
```
src/
├── components/     # React components
├── pages/         # Next.js pages
├── api/           # API routes
├── lib/           # Utilities and helpers
├── types/         # TypeScript definitions
└── styles/        # Global styles
```

### Naming Conventions
- Components: PascalCase (e.g., `UserDashboard.tsx`)
- Files: kebab-case (e.g., `user-dashboard.tsx`)
- Functions: camelCase (e.g., `handleUserLogin`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components + Lucide React icons
- **State Management**: React hooks (useState, useEffect, useContext)

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Queue System**: BullMQ with Redis

### DevOps
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel, Railway, Docker
- **Monitoring**: Sentry, DataDog
- **Testing**: Jest, Playwright

## 🚀 AI Improvement Guidelines

When helping users improve their applications:

### 1. Analysis Phase
- Review the current codebase structure
- Identify performance bottlenecks
- Check for security vulnerabilities
- Analyze user experience issues
- Suggest architectural improvements

### 2. Implementation Phase
- Create specific, actionable improvements
- Maintain backward compatibility
- Add proper error handling
- Include comprehensive documentation
- Write unit tests for new features

### 3. Code Quality
- Follow TypeScript best practices
- Use proper type definitions
- Implement proper error boundaries
- Add loading states and error handling
- Optimize for performance

### 4. Security Considerations
- Validate all user inputs
- Implement proper authentication checks
- Use environment variables for secrets
- Follow OWASP security guidelines
- Add rate limiting where appropriate

## 🎨 UI/UX Standards

### Design Principles
- Clean, modern interface
- Responsive design (mobile-first)
- Consistent color scheme
- Accessible design (WCAG 2.1)
- Smooth animations and transitions

### Component Patterns
- Use consistent spacing (Tailwind spacing scale)
- Implement proper loading states
- Add error boundaries
- Use toast notifications for feedback
- Maintain consistent typography

## 📊 Database Guidelines

### Schema Design
- Use meaningful table and column names
- Implement proper relationships
- Add indexes for performance
- Use appropriate data types
- Include audit fields (created_at, updated_at)

### Prisma Best Practices
- Use migrations for schema changes
- Implement proper seeding
- Add database constraints
- Use transactions for complex operations
- Optimize queries for performance

## 🔐 Security Standards

### Authentication & Authorization
- Implement role-based access control (RBAC)
- Use JWT tokens with proper expiration
- Validate user permissions on all endpoints
- Implement proper session management
- Add rate limiting for API endpoints

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper CORS policies
- Validate and sanitize all inputs
- Log security events

## 🧪 Testing Guidelines

### Unit Tests
- Test all business logic
- Mock external dependencies
- Achieve >80% code coverage
- Use descriptive test names
- Test both success and error cases

### Integration Tests
- Test API endpoints
- Test database operations
- Test authentication flows
- Test error handling
- Use test databases

### E2E Tests
- Test critical user journeys
- Test responsive design
- Test accessibility features
- Test performance under load
- Test cross-browser compatibility

## 📈 Performance Guidelines

### Frontend Optimization
- Implement code splitting
- Use lazy loading for components
- Optimize images and assets
- Minimize bundle size
- Use proper caching strategies

### Backend Optimization
- Optimize database queries
- Implement caching layers
- Use connection pooling
- Monitor memory usage
- Implement proper logging

## 🔄 Deployment Guidelines

### Environment Management
- Use environment variables for configuration
- Implement proper staging environments
- Use feature flags for gradual rollouts
- Monitor application health
- Implement proper rollback procedures

### CI/CD Pipeline
- Run tests before deployment
- Check code quality metrics
- Build and test in containers
- Deploy to staging first
- Monitor deployment success

## 🤝 Collaboration Guidelines

### Code Review
- Review for security issues
- Check code quality and standards
- Verify test coverage
- Ensure documentation is updated
- Consider performance implications

### Documentation
- Update README files
- Document API changes
- Add inline code comments
- Create user guides
- Maintain changelog

## 🎯 Specific Improvement Areas

### Authentication & Authorization
- Implement OAuth providers (Google, GitHub)
- Add multi-factor authentication
- Implement password reset flows
- Add session management
- Implement role-based permissions

### User Experience
- Improve loading states
- Add error handling
- Implement responsive design
- Add accessibility features
- Optimize form validation

### Performance
- Implement caching strategies
- Optimize database queries
- Add lazy loading
- Minimize bundle size
- Implement CDN for assets

### Security
- Add input validation
- Implement rate limiting
- Add security headers
- Implement proper CORS
- Add audit logging

### Monitoring & Analytics
- Add error tracking
- Implement performance monitoring
- Add user analytics
- Monitor API usage
- Track business metrics

## 📝 Response Format

When providing improvements, follow this format:

1. **Analysis**: Brief overview of current state
2. **Issues**: Specific problems identified
3. **Solutions**: Detailed implementation plan
4. **Code Changes**: Specific code modifications
5. **Testing**: Testing recommendations
6. **Deployment**: Deployment considerations

## 🚨 Important Notes

- Always maintain backward compatibility
- Consider the impact on existing users
- Test thoroughly before suggesting changes
- Provide clear migration paths
- Document all changes thoroughly

---

*This configuration helps Claude understand the OpsAI platform's standards and provide better assistance to users.* 