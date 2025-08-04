# 🤖 OpsAI Agent System Usage Guide

## Quick Start

### 1. Setup Environment

```bash
# Copy and edit environment variables
cp agent-service/.env.example agent-service/.env
# Edit agent-service/.env with your API keys

# Install Python dependencies
cd agent-service
pip install -r requirements.txt
```

### 2. Start Services

**Option A: Using Docker (Recommended)**
```bash
./start-agents.sh
```

**Option B: Manual Start**
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Agent Service
cd agent-service
uvicorn main:app --reload --port 8000

# Terminal 3: Start Next.js app
npm run dev
```

### 3. Access the Agent Dashboard

1. Go to your app dashboard: `http://localhost:3000/dashboard/[appId]/agents`
2. You'll see the AI Agents interface with presets and custom options

## 🎯 Using Agent Presets

The dashboard includes 5 pre-configured agent workflows:

### 1. **Business Analysis Suite**
Performs comprehensive business analysis:
```javascript
// Automatically runs:
- Market research and competitor analysis
- ROI calculation and financial metrics
- Workflow optimization recommendations
```

### 2. **Full-Stack Development**
Generates complete features:
```javascript
// Creates:
- React/Vue/Angular components
- API endpoints with validation
- Database schemas
- Unit and integration tests
- Documentation
```

### 3. **Customer Engagement**
Automates customer communication:
```javascript
// Capabilities:
- Send automated phone calls (Twilio)
- Send personalized emails (SendGrid)
- SMS messaging
- Slack notifications
```

### 4. **Finance Automation**
Handles financial operations:
```javascript
// Features:
- Process payments via Stripe
- Generate and send invoices
- Track expenses
- QuickBooks integration
```

### 5. **Integration Hub**
Connects external services:
```javascript
// Functions:
- Set up OAuth connections
- Configure webhooks
- API integrations
- Data synchronization
```

## 🛠️ Custom Agent Tasks

### Using the API Directly

**Single Agent Execution:**
```javascript
// Example: Generate a React component
const response = await fetch('/api/agents/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agent_name: 'Code Generator',
    task_type: 'component',
    parameters: {
      name: 'UserProfile',
      framework: 'react',
      description: 'User profile card with avatar, name, and stats',
      props: ['user', 'onEdit', 'onDelete'],
      styling: 'tailwind'
    }
  })
})

const result = await response.json()
// Result contains generated files and instructions
```

**Agent Crew Execution:**
```javascript
// Example: Full feature development
const response = await fetch('/api/agents/crew', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agents: ['Business Analyst', 'Code Generator'],
    tasks: [
      {
        type: 'market_research',
        parameters: {
          query: 'user dashboard features in SaaS',
          industry: 'technology'
        }
      },
      {
        type: 'full_feature',
        parameters: {
          name: 'AnalyticsDashboard',
          description: 'Based on market research findings'
        }
      }
    ],
    process_type: 'sequential'
  })
})
```

### Real-time Updates via WebSocket

```javascript
// Connect to WebSocket for live updates
const ws = new WebSocket('ws://localhost:8000/ws')

ws.onmessage = (event) => {
  const update = JSON.parse(event.data)
  console.log('Agent update:', update)
  // Update UI with progress
}
```

## 📋 Example Use Cases

### 1. Build a Complete E-commerce Feature

```javascript
// Use the dashboard or API to execute:
{
  agents: ['Business Analyst', 'Code Generator', 'Integration Specialist'],
  tasks: [
    { type: 'market_research', parameters: { query: 'e-commerce checkout best practices' }},
    { type: 'full_feature', parameters: { name: 'CheckoutFlow' }},
    { type: 'payment_integration', parameters: { provider: 'stripe' }}
  ]
}
```

### 2. Automate Customer Onboarding

```javascript
{
  agents: ['Communication Specialist', 'Finance Manager'],
  tasks: [
    { type: 'send_welcome_email', parameters: { template: 'new_customer' }},
    { type: 'schedule_onboarding_call', parameters: { delay_days: 2 }},
    { type: 'create_initial_invoice', parameters: { plan: 'starter' }}
  ]
}
```

### 3. Generate API Documentation

```javascript
{
  agent_name: 'Code Generator',
  task_type: 'documentation',
  parameters: {
    type: 'api',
    endpoints: ['/api/users', '/api/products', '/api/orders'],
    format: 'openapi'
  }
}
```

## 🔧 Advanced Configuration

### Custom Agent Parameters

Each agent supports specific parameters:

**Business Analyst:**
```javascript
{
  type: 'comprehensive',
  parameters: {
    business_name: 'Your Company',
    industry: 'SaaS',
    financial_data: {
      investment: 50000,
      revenue: 120000,
      costs: 30000,
      timeframe_months: 12
    },
    market_volatility: true,
    handles_sensitive_data: true
  }
}
```

**Code Generator:**
```javascript
{
  type: 'full_feature',
  parameters: {
    name: 'FeatureName',
    framework: 'react', // or 'vue', 'angular'
    typescript: true,
    testing: 'jest', // or 'vitest', 'cypress'
    styling: 'tailwind', // or 'css', 'styled-components'
    state_management: 'zustand' // or 'redux', 'context'
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Agent service not responding**
   - Check Redis is running: `redis-cli ping`
   - Verify API keys in .env file
   - Check logs: `docker-compose logs agent-service`

2. **WebSocket connection failed**
   - Ensure port 8000 is not blocked
   - Check CORS settings in next.config.js
   - Try direct connection: `wscat -c ws://localhost:8000/ws`

3. **Task execution timeout**
   - Some tasks (like market research) can take 30-60 seconds
   - Check agent service logs for errors
   - Increase timeout in agent configuration

### Debug Mode

Enable debug logging:
```bash
# In agent-service/.env
DEBUG=true
LOG_LEVEL=debug
```

## 📊 Monitoring

View real-time logs:
```bash
# All services
docker-compose -f docker-compose.agents.yml logs -f

# Agent service only
docker-compose -f docker-compose.agents.yml logs -f agent-service

# Redis
docker-compose -f docker-compose.agents.yml logs -f redis
```

## 🔒 Security Notes

1. **API Keys**: Never commit .env files to git
2. **Authentication**: All agent endpoints require authentication
3. **Rate Limiting**: Default 100 requests/minute per user
4. **Data Privacy**: Agent conversations are stored in Redis for 1 hour

## 📚 Next Steps

1. **Customize Agents**: Add your own agents in `agent-service/agents/`
2. **Create Tools**: Extend capabilities in `agent-service/tools/`
3. **Build Workflows**: Chain agents for complex automation
4. **Monitor Usage**: Track agent performance and costs

For more details, see the [Agent Service README](agent-service/README.md)