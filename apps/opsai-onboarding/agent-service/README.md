# OpsAI Agent Service

A powerful multi-agent system built with CrewAI and LangChain for automating business tasks.

## Features

- **Multiple Specialized Agents**:
  - Business Analyst: Market research, ROI calculation, workflow optimization
  - Code Generator: Generate components, APIs, full features with tests
  - Communication Specialist: Automated calls, emails, SMS via Twilio/SendGrid
  - Finance Manager: Payment processing, invoicing, expense tracking
  - Integration Specialist: OAuth setup, webhooks, data synchronization

- **Agent Orchestration**: Run single agents or coordinate multiple agents as a crew
- **Real-time Updates**: WebSocket support for live progress tracking
- **State Persistence**: Redis-backed memory and result caching
- **Tool Library**: Extensive collection of tools for each agent

## Setup

### Prerequisites

- Python 3.11+
- Redis server
- API keys for:
  - OpenAI or Anthropic (LLM)
  - Twilio (for communication features)
  - Stripe (for payment processing)
  - SendGrid (for email)
  - Slack (optional)

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export OPENAI_API_KEY="your-key"
export REDIS_URL="redis://localhost:6379"
export TWILIO_ACCOUNT_SID="your-sid"
export TWILIO_AUTH_TOKEN="your-token"
export STRIPE_API_KEY="your-key"
export SENDGRID_API_KEY="your-key"
```

3. Run the service:
```bash
uvicorn main:app --reload
```

### Docker Setup

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.agents.yml up
```

## API Endpoints

### Execute Single Agent

```http
POST /agents/execute
Content-Type: application/json

{
  "agent_name": "Business Analyst",
  "task_type": "market_research",
  "parameters": {
    "query": "SaaS market trends 2024",
    "industry": "technology"
  }
}
```

### Execute Agent Crew

```http
POST /crew/execute
Content-Type: application/json

{
  "agents": ["Business Analyst", "Code Generator"],
  "tasks": [
    {
      "type": "market_research",
      "parameters": {"query": "e-commerce trends"}
    },
    {
      "type": "full_feature",
      "parameters": {"name": "ProductCatalog"}
    }
  ],
  "process_type": "sequential"
}
```

### WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:8000/ws')

ws.onmessage = (event) => {
  const update = JSON.parse(event.data)
  console.log('Agent update:', update)
}
```

## Agent Capabilities

### Business Analyst
- Market research and competitive analysis
- ROI and financial metrics calculation
- Workflow optimization recommendations
- Risk assessment and mitigation strategies

### Code Generator
- Generate React/Vue/Angular components
- Create REST/GraphQL API endpoints
- Design database schemas with migrations
- Write unit and integration tests
- Generate comprehensive documentation

### Communication Specialist
- Make automated phone calls via Twilio
- Send personalized emails via SendGrid
- Send SMS messages
- Post to Slack channels
- Schedule follow-up sequences

### Finance Manager
- Process payments via Stripe
- Generate and send invoices
- Track expenses with categorization
- QuickBooks integration
- Financial reporting

### Integration Specialist
- Set up OAuth connections
- Configure webhooks
- Manage API integrations
- Synchronize data between systems
- Handle authentication flows

## Extending the System

### Adding New Agents

1. Create a new agent file in `agents/`:
```python
from crewai import Agent
from langchain_openai import ChatOpenAI

class CustomAgent:
    def __init__(self, llm: ChatOpenAI, redis_client):
        self.agent = Agent(
            role="Your Role",
            goal="Your Goal",
            backstory="Your Backstory",
            tools=[],  # Add your tools
            llm=llm
        )
```

2. Register in `main.py`:
```python
AVAILABLE_AGENTS["Custom Agent"] = CustomAgent
```

### Adding New Tools

1. Create tool in `tools/`:
```python
from langchain.tools import BaseTool

class CustomTool(BaseTool):
    name = "custom_tool"
    description = "Tool description"
    
    def _run(self, query: str) -> str:
        # Tool implementation
        return "Result"
```

## Production Deployment

1. Use environment-specific configs
2. Enable SSL/TLS for WebSocket connections
3. Set up monitoring and logging
4. Configure rate limiting
5. Use production Redis instance
6. Set up load balancing for multiple instances

## Troubleshooting

- **WebSocket connection fails**: Check CORS settings and firewall rules
- **Agent timeout**: Increase task timeout in agent configuration
- **Redis connection error**: Verify Redis is running and accessible
- **API key errors**: Ensure all required environment variables are set

## License

MIT