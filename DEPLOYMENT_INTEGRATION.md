# 🔄 Deployment Integration Guide

This guide explains how the enhanced deployment system integrates with your existing Turbo monorepo structure.

## 🎯 Integration Overview

### **Before (Original Process):**
```bash
# Simple Turbo-based deployment
pnpm dev          # Run all apps in development
pnpm build        # Build all packages and apps
pnpm deploy       # Basic CLI deployment
```

### **After (Enhanced Process):**
```bash
# Enhanced integrated deployment
pnpm dev          # Run all apps in development
pnpm build        # Build all packages and apps
pnpm deploy:staging    # Deploy to staging
pnpm deploy:production # Deploy to production
pnpm deploy:apps       # Deploy only generated apps
pnpm deploy:platform   # Deploy only main platform
```

## 🔄 How Integration Works

### **1. Root Level Commands (Enhanced)**
```bash
# Deploy everything
pnpm deploy:staging
pnpm deploy:production

# Deploy specific components
pnpm deploy:apps --env=staging
pnpm deploy:platform --env=production

# Check status
pnpm cli deploy status
pnpm cli deploy list
```

### **2. Individual App Commands (New)**
```bash
# Navigate to specific generated app
cd apps/opsai-onboarding/generated-apps/b2c-marketplace-1753994588864

# Deploy individual app
npm run deploy:staging
npm run deploy:production
npm run docker:compose
```

### **3. GitHub Actions (Integrated)**
```yaml
# Automatic deployment on push
on:
  push:
    branches: [main, develop, staging]

# Manual deployment with options
on:
  workflow_dispatch:
    inputs:
      app_name: 'specific-app-name'
      environment: 'staging'
```

## 🏗️ Architecture Integration

### **Turbo Pipeline Enhancement**
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "deploy": {
      "dependsOn": ["build"],
      "cache": false
    },
    "deploy:staging": {
      "dependsOn": ["build"],
      "cache": false
    },
    "deploy:production": {
      "dependsOn": ["build"],
      "cache": false
    }
  }
}
```

### **Monorepo Structure**
```
opsai-core/
├── apps/
│   ├── opsai-onboarding/           # Main platform
│   │   ├── generated-apps/         # Generated applications
│   │   │   ├── b2c-marketplace-*/  # Individual apps
│   │   │   └── ...
│   │   └── ...
│   └── line-properties/            # Other apps
├── packages/                       # Shared packages
├── scripts/
│   └── cli/
│       ├── core.ts                 # Existing CLI
│       └── deploy.ts               # New deployment CLI
└── .github/
    └── workflows/
        └── deploy.yml              # Integrated CI/CD
```

## 🚀 Usage Examples

### **Development Workflow**
```bash
# 1. Start development
pnpm dev

# 2. Generate new app
pnpm generate

# 3. Deploy to staging
pnpm deploy:staging

# 4. Deploy to production
pnpm deploy:production
```

### **Individual App Management**
```bash
# List all generated apps
pnpm cli deploy list

# Check deployment status
pnpm cli deploy status

# Deploy specific app
pnpm cli deploy apps --app=b2c-marketplace-1753994588864 --env=staging

# Deploy all generated apps
pnpm cli deploy apps --env=production
```

### **Platform Management**
```bash
# Deploy only main platform
pnpm cli deploy platform --env=staging

# Deploy everything
pnpm cli deploy all --env=production
```

## 🔧 Configuration Integration

### **Environment Variables**
```bash
# Root level (.env)
NODE_ENV=production
TURBO_TEAM=your-team
TURBO_TOKEN=your-token

# App specific (.env.staging, .env.production)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
SUPABASE_URL=https://...
```

### **Turbo Configuration**
```json
{
  "globalEnv": [
    "NODE_ENV",
    "DATABASE_URL",
    "JWT_SECRET",
    "SUPABASE_URL"
  ],
  "pipeline": {
    "deploy": {
      "dependsOn": ["build"],
      "env": ["DATABASE_URL", "JWT_SECRET"]
    }
  }
}
```

## 📊 Monitoring Integration

### **Unified Monitoring**
```bash
# Monitor all services
pnpm monitor:logs

# Health checks
pnpm monitor:health

# Individual app monitoring
cd apps/opsai-onboarding/generated-apps/b2c-marketplace-1753994588864
npm run monitor:logs
```

### **Dashboard Access**
- **Grafana**: `http://localhost:3001` (admin/admin)
- **Kibana**: `http://localhost:5601`
- **Prometheus**: `http://localhost:9090`

## 🔄 Migration Guide

### **Step 1: Update Root Package.json**
```bash
# Add new deployment scripts
pnpm add -D chalk commander
```

### **Step 2: Configure Environment**
```bash
# Create environment files
cp env.example .env.staging
cp env.example .env.production

# Add required secrets
echo "DATABASE_URL=..." >> .env.staging
echo "JWT_SECRET=..." >> .env.staging
```

### **Step 3: Test Integration**
```bash
# Test deployment commands
pnpm cli deploy status
pnpm cli deploy list
pnpm deploy:staging
```

### **Step 4: Update CI/CD**
```bash
# GitHub Actions will automatically use new workflow
# No additional configuration needed
```

## 🎯 Benefits of Integration

### **1. Unified Workflow**
- Single command to deploy everything
- Consistent deployment process
- Integrated monitoring and logging

### **2. Flexibility**
- Deploy individual apps
- Deploy main platform only
- Deploy everything together

### **3. Enhanced Security**
- Automated security scanning
- Secrets management
- Environment isolation

### **4. Better Monitoring**
- Unified dashboards
- Centralized logging
- Performance tracking

### **5. Scalability**
- Multi-platform deployment
- Auto-scaling support
- Load balancing

## 🔧 Troubleshooting

### **Common Issues**

#### **1. Turbo Cache Issues**
```bash
# Clear Turbo cache
pnpm turbo clean

# Rebuild everything
pnpm build
```

#### **2. Environment Variables**
```bash
# Check environment
pnpm cli deploy status

# Verify secrets
echo $DATABASE_URL
echo $JWT_SECRET
```

#### **3. Individual App Issues**
```bash
# Check app status
cd apps/opsai-onboarding/generated-apps/b2c-marketplace-1753994588864
npm run monitor:health

# Rebuild app
npm run build
```

### **Debug Commands**
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f

# Check deployment status
pnpm cli deploy status
```

## 📈 Performance Optimization

### **Build Optimization**
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"],
      "cache": true
    }
  }
}
```

### **Deployment Optimization**
- Parallel deployment of apps
- Cached Docker layers
- Optimized build processes

## 🔒 Security Considerations

### **Secrets Management**
- Use environment-specific secrets
- Rotate secrets regularly
- Monitor secret usage

### **Access Control**
- Role-based deployment access
- Environment-specific permissions
- Audit logging

## 🎉 Success Metrics

### **Deployment Metrics**
- Deployment time reduction
- Success rate improvement
- Rollback frequency

### **Operational Metrics**
- Uptime improvement
- Response time reduction
- Error rate decrease

---

## 🚀 Next Steps

1. **Test the integration** with staging environment
2. **Configure monitoring** dashboards
3. **Set up alerts** for critical issues
4. **Train team** on new deployment process
5. **Monitor performance** and optimize

---

**The enhanced deployment system is now fully integrated with your existing Turbo monorepo structure! 🎉** 