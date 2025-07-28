# CORE Platform - Business Application Generator

A powerful platform for generating complete SaaS vertical applications from configuration files. Build insurance, bakery, legal, and MTO management systems with ease.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/company/opsai-core.git
   cd opsai-core
   ```

2. **Setup development environment**
```bash
   ./scripts/development/setup-dev.sh
   ```

3. **Generate your first vertical**
   ```bash
   pnpm cli generate vertical insurance --config=configs/verticals/insurance.yml
   ```

4. **Start the generated application**
   ```bash
   cd apps/insurance-saas
   docker-compose up
   ```

## 📋 What's Included

### Core Packages

- **@opsai/shared** - Common types, utilities, and validation
- **@opsai/database** - Database management with Prisma, multi-tenant support
- **@opsai/auth** - Authentication with Supabase, RBAC
- **@opsai/integration** - API integrations with Airbyte, custom connectors
- **@opsai/workflow** - Business process automation with Temporal
- **@opsai/alerts** - Intelligent alerting system
- **@opsai/files** - File storage and processing
- **@opsai/ui** - React components and form generators

### Generated Applications

- **Insurance SaaS** - Policy management, claims processing, quote generation
- **Bakery SaaS** - Order management, inventory, customer management
- **Legal SaaS** - Case management, document automation, billing
- **MTO SaaS** - Manufacturing order tracking, quality control

## 🛠️ CLI Commands

### Generate Applications
```bash
# Generate a vertical application
pnpm cli generate vertical <name> --config=<config-file>

# Generate an integration
pnpm cli generate integration <provider> --to=<vertical>

# Generate a workflow
pnpm cli generate workflow <name> --config=<workflow-config>
```

### Deploy Applications
```bash
# Deploy a vertical
pnpm cli deploy vertical <name> --environment=<env>

# Deploy all verticals
pnpm cli deploy all --environment=production
```

### Database Operations
```bash
# Run migrations
pnpm cli db migrate --vertical=<vertical>

# Seed database
pnpm cli db seed --vertical=<vertical> --data=<seed-file>

# Create backup
pnpm cli db backup --vertical=<vertical>

# Restore backup
pnpm cli db restore --vertical=<vertical> --backup=<backup-file>
```

### Development
```bash
# Setup development environment
pnpm dev setup

# Reset databases
pnpm dev reset

# Seed test data
pnpm dev seed
```

### Testing
```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test unit
pnpm test integration
pnpm test e2e
```

## 🏗️ Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────┐
│                 CORE PLATFORM ENGINE                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │  @opsai/auth  │ │@opsai/database│ │ @opsai/integration    │ │
│  │  @opsai/files │ │@opsai/workflow│ │ @opsai/alerts         │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                        Configuration Input
                                ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│   Insurance    │ │     Bakery     │ │     Legal      │ │      MTO       │
│     SaaS       │ │     SaaS       │ │     SaaS       │ │     SaaS       │
│                │ │                │ │                │ │                │
│ 🗄️ Postgres DB │ │ 🗄️ Postgres DB │ │ 🗄️ Postgres DB │ │ 🗄️ Postgres DB │
│ 🔐 Supabase    │ │ 🔐 Supabase    │ │ 🔐 Supabase    │ │ 🔐 Supabase    │
│ 🌐 Next.js UI  │ │ 📱 React Native│ │ 🌐 Next.js UI  │ │ 🌐 Next.js UI  │
│ ⚡ NestJS API  │ │ ⚡ NestJS API  │ │ ⚡ NestJS API  │ │ ⚡ NestJS API  │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Monorepo** | pnpm + Turborepo | Package management & build orchestration |
| **Backend** | NestJS + TypeScript | API framework with dependency injection |
| **Database** | PostgreSQL + Prisma | Relational database with type-safe ORM |
| **Auth** | Supabase Auth | Authentication & user management |
| **Storage** | Supabase Storage | File storage with CDN |
| **Cache** | Redis | Session storage & caching |
| **Queue** | BullMQ + Redis | Background job processing |
| **Workflow** | Temporal | Long-running business processes |
| **Frontend** | Next.js 14 + TypeScript | React meta-framework with RSC |
| **Mobile** | React Native + Expo | Cross-platform mobile apps |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS + component library |
| **Integration** | Airbyte + Custom | Data pipeline & API connectors |
| **Monitoring** | Grafana + Prometheus | Observability & metrics |
| **Deployment** | Docker + AWS/Railway | Containerized deployment |

## 📁 Project Structure

```
opsai-core/
├── packages/                    # Core packages
│   ├── shared/                 # Common types and utilities
│   ├── database/               # Database management
│   ├── auth/                   # Authentication
│   ├── integration/            # API integrations
│   ├── workflow/               # Business processes
│   ├── alerts/                 # Alerting system
│   ├── files/                  # File management
│   └── ui/                     # UI components
├── apps/                       # Generated applications
│   ├── insurance-saas/
│   ├── bakery-saas/
│   ├── legal-saas/
│   └── mto-saas/
├── configs/                    # Configuration templates
│   ├── verticals/             # Vertical configurations
│   ├── integrations/          # Integration configs
│   └── deployment/            # Deployment configs
├── scripts/                    # Development scripts
│   ├── cli/                   # CLI tool
│   ├── generators/            # Code generators
│   └── development/           # Dev utilities
└── docs/                      # Documentation
```

## 🔧 Configuration

### Vertical Configuration

Each vertical is defined by a YAML configuration file:

```yaml
vertical:
  name: insurance
  description: Insurance management SaaS
  version: 1.0.0

database:
  models:
    - name: Policy
      fields:
        - name: policyNumber
          type: string
          required: true
          unique: true
        - name: premium
          type: decimal
          required: true

apis:
  integrations:
    - name: progressive
      type: rest
      base_url: https://api.progressive.com
      authentication:
        type: api_key
        header: X-API-Key

workflows:
  - name: quote_generation
    description: Generate insurance quote
    trigger:
      type: api_call
      endpoint: /api/quotes
      method: POST
    steps:
      - name: validate_application
        activity: validate_data
      - name: call_carrier_api  
        activity: http_request

ui:
  theme:
    primary_color: "#1e40af"
  pages:
    - name: dashboard
      path: /dashboard
      components:
        - type: stats_cards
          data_source: policies_summary

alerts:
  rules:
    - name: policy_expiring_soon
      conditions:
        - field: expirationDate
        operator: less_than
        value: "now() + 30 days"
      actions:
        - type: email
          template: policy_renewal_reminder

deployment:
  environment: production
  resources:
    api:
      cpu: 0.5
      memory: 1Gi
      replicas: 2
```

## 🚀 Deployment

### Local Development
```bash
# Start all services
docker-compose up -d

# Run development server
pnpm dev
```

### Production Deployment
```bash
# Deploy to production
pnpm cli deploy vertical insurance --environment=production

# Deploy all verticals
pnpm cli deploy all --environment=production
```

## 📊 Monitoring

### Health Checks
- **API Health**: `/health`
- **Database Health**: `/health/db`
- **Redis Health**: `/health/redis`
- **Integration Health**: `/health/integrations`

### Metrics
- **Business Metrics**: Revenue, user growth, feature usage
- **Technical Metrics**: Response times, error rates, resource usage
- **Integration Metrics**: Sync success rates, API call volumes

### Alerts
- **Critical Errors**: Immediate notification
- **Performance Issues**: Response time thresholds
- **Business Alerts**: Revenue drops, user churn

## 🧪 Testing

### Test Types
- **Unit Tests**: Individual component testing
- **Integration Tests**: API and database testing
- **E2E Tests**: Full user journey testing
- **Performance Tests**: Load and stress testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Run tests with coverage
pnpm test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Use conventional commits

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/company/opsai-core/issues)
- **Discussions**: [GitHub Discussions](https://github.com/company/opsai-core/discussions)

## 🎯 Roadmap

### Phase 1: Core Platform ✅
- [x] Multi-tenant architecture
- [x] Database schema generation
- [x] API integration framework
- [x] Workflow engine
- [x] Alerting system

### Phase 2: Vertical Applications 🚧
- [x] Insurance SaaS
- [ ] Bakery SaaS
- [ ] Legal SaaS
- [ ] MTO SaaS

### Phase 3: Advanced Features 📋
- [ ] AI-powered insights
- [ ] Advanced analytics
- [ ] Mobile applications
- [ ] Third-party integrations

### Phase 4: Enterprise Features 📋
- [ ] White-label solutions
- [ ] Advanced security
- [ ] Compliance features
- [ ] Enterprise support

---

**Built with ❤️ by the CORE Platform Team**