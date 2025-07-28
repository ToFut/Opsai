import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from './ConfigParser';

export class DeploymentGenerator {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  async generateDeployment(outputDir: string): Promise<void> {
    if (!this.config.deployment) {
      console.log('ℹ️  No deployment configuration found');
      return;
    }

    const deploymentDir = path.join(outputDir, 'deployment');
    fs.mkdirSync(deploymentDir, { recursive: true });

    const platform = this.config.deployment.platform;

    switch (platform) {
      case 'netlify':
        await this.generateNetlifyDeployment(deploymentDir);
        break;
      case 'vercel':
        await this.generateVercelDeployment(deploymentDir);
        break;
      case 'aws':
        await this.generateAWSDeployment(deploymentDir);
        break;
      case 'docker':
        await this.generateDockerDeployment(deploymentDir);
        break;
      case 'kubernetes':
        await this.generateKubernetesDeployment(deploymentDir);
        break;
      default:
        console.log(`⚠️  Unknown deployment platform: ${platform}`);
        await this.generateGenericDeployment(deploymentDir);
    }

    // Generate deployment scripts
    await this.generateDeploymentScripts(deploymentDir);

    // Generate CI/CD configuration
    await this.generateCICDConfig(outputDir);

    console.log('✅ Deployment configuration generated');
  }

  private async generateNetlifyDeployment(deploymentDir: string): Promise<void> {
    const netlifyConfig = {
      build: {
        command: this.config.deployment?.build_command || 'npm run build',
        publish: this.config.deployment?.output_directory || 'dist',
        environment: this.buildEnvironmentVariables()
      },
      functions: {
        directory: 'netlify/functions'
      },
      redirects: [
        {
          from: '/api/*',
          to: '/.netlify/functions/:splat',
          status: 200
        },
        {
          from: '/*',
          to: '/index.html',
          status: 200
        }
      ]
    };

    fs.writeFileSync(
      path.join(deploymentDir, 'netlify.toml'),
      this.toToml(netlifyConfig)
    );

    // Generate Netlify functions
    const functionsDir = path.join(deploymentDir, 'netlify', 'functions');
    fs.mkdirSync(functionsDir, { recursive: true });

    const serverlessFunction = `
const { createServer } = require('../../dist/api/server');

exports.handler = async (event, context) => {
  const app = createServer();
  
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const request = {
        method: event.httpMethod,
        url: event.path,
        headers: event.headers,
        body: event.body
      };

      app.handle(request, {
        writeHead: (statusCode, headers) => {
          resolve({
            statusCode,
            headers,
            body: ''
          });
        },
        end: (body) => {
          resolve({
            statusCode: 200,
            body
          });
        }
      });
    });
  });
};
`;

    fs.writeFileSync(path.join(functionsDir, 'api.js'), serverlessFunction.trim());

    console.log('📄 Generated Netlify deployment configuration');
  }

  private async generateVercelDeployment(deploymentDir: string): Promise<void> {
    const vercelConfig = {
      version: 2,
      builds: [
        {
          src: 'src/api/server.ts',
          use: '@vercel/node'
        },
        {
          src: 'public/**/*',
          use: '@vercel/static'
        }
      ],
      routes: [
        {
          src: '/api/(.*)',
          dest: '/src/api/server.ts'
        },
        {
          src: '/(.*)',
          dest: '/public/$1'
        }
      ],
      env: this.buildEnvironmentVariables()
    };

    fs.writeFileSync(
      path.join(deploymentDir, 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );

    console.log('📄 Generated Vercel deployment configuration');
  }

  private async generateAWSDeployment(deploymentDir: string): Promise<void> {
    // Generate CloudFormation template
    const cloudFormationTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: `CloudFormation template for ${this.config.app.displayName}`,
      Parameters: {
        EnvironmentName: {
          Type: 'String',
          Default: 'production',
          Description: 'Environment name'
        }
      },
      Resources: {
        VPC: {
          Type: 'AWS::EC2::VPC',
          Properties: {
            CidrBlock: '10.0.0.0/16',
            EnableDnsHostnames: true,
            EnableDnsSupport: true
          }
        },
        ECSCluster: {
          Type: 'AWS::ECS::Cluster',
          Properties: {
            ClusterName: `${this.config.app.name}-cluster`
          }
        },
        TaskDefinition: {
          Type: 'AWS::ECS::TaskDefinition',
          Properties: {
            Family: `${this.config.app.name}-task`,
            NetworkMode: 'awsvpc',
            RequiresCompatibilities: ['FARGATE'],
            Cpu: 256,
            Memory: 512,
            ContainerDefinitions: [
              {
                Name: this.config.app.name,
                Image: `${this.config.app.name}:latest`,
                PortMappings: [
                  {
                    ContainerPort: 3000,
                    Protocol: 'tcp'
                  }
                ],
                Environment: Object.entries(this.buildEnvironmentVariables()).map(([key, value]) => ({
                  Name: key,
                  Value: value
                }))
              }
            ]
          }
        },
        RDSInstance: {
          Type: 'AWS::RDS::DBInstance',
          Properties: {
            DBInstanceIdentifier: `${this.config.app.name}-db`,
            DBInstanceClass: 'db.t3.micro',
            Engine: 'postgres',
            MasterUsername: 'postgres',
            MasterUserPassword: '!Ref DatabasePassword',
            AllocatedStorage: 20
          }
        }
      }
    };

    fs.writeFileSync(
      path.join(deploymentDir, 'cloudformation.yaml'),
      JSON.stringify(cloudFormationTemplate, null, 2)
    );

    // Generate AWS SAM template
    const samTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Transform: 'AWS::Serverless-2016-10-31',
      Description: `SAM template for ${this.config.app.displayName}`,
      Resources: {
        ApiFunction: {
          Type: 'AWS::Serverless::Function',
          Properties: {
            CodeUri: 'dist/',
            Handler: 'api/server.handler',
            Runtime: 'nodejs18.x',
            Environment: {
              Variables: this.buildEnvironmentVariables()
            },
            Events: {
              Api: {
                Type: 'Api',
                Properties: {
                  Path: '/{proxy+}',
                  Method: 'ANY'
                }
              }
            }
          }
        }
      }
    };

    fs.writeFileSync(
      path.join(deploymentDir, 'template.yaml'),
      JSON.stringify(samTemplate, null, 2)
    );

    console.log('📄 Generated AWS deployment configuration');
  }

  private async generateDockerDeployment(deploymentDir: string): Promise<void> {
    // Enhanced Dockerfile for production
    const dockerfile = `
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY prisma/ ./prisma/

# Build application
RUN npm run build
RUN npm run db:generate

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node healthcheck.js

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/api/server.js"]
`;

    fs.writeFileSync(path.join(deploymentDir, 'Dockerfile'), dockerfile.trim());

    // Docker Compose for production
    const dockerCompose = {
      version: '3.8',
      services: {
        app: {
          build: {
            context: '.',
            dockerfile: 'deployment/Dockerfile'
          },
          ports: ['3000:3000'],
          environment: this.buildEnvironmentVariables(),
          depends_on: ['db', 'redis'],
          volumes: ['./uploads:/app/uploads'],
          restart: 'unless-stopped',
          healthcheck: {
            test: ['CMD', 'node', 'healthcheck.js'],
            interval: '30s',
            timeout: '3s',
            retries: 3
          }
        },
        db: {
          image: 'postgres:15-alpine',
          environment: {
            POSTGRES_DB: this.config.app.name,
            POSTGRES_USER: 'postgres',
            POSTGRES_PASSWORD: '${POSTGRES_PASSWORD}'
          },
          ports: ['5432:5432'],
          volumes: ['postgres_data:/var/lib/postgresql/data'],
          restart: 'unless-stopped'
        },
        redis: {
          image: 'redis:7-alpine',
          ports: ['6379:6379'],
          volumes: ['redis_data:/data'],
          restart: 'unless-stopped'
        },
        nginx: {
          image: 'nginx:alpine',
          ports: ['80:80', '443:443'],
          volumes: [
            './deployment/nginx.conf:/etc/nginx/nginx.conf',
            './deployment/ssl:/etc/nginx/ssl'
          ],
          depends_on: ['app'],
          restart: 'unless-stopped'
        }
      },
      volumes: {
        postgres_data: {},
        redis_data: {}
      }
    };

    fs.writeFileSync(
      path.join(deploymentDir, 'docker-compose.prod.yml'),
      JSON.stringify(dockerCompose, null, 2)
    );

    // Nginx configuration
    const nginxConfig = `
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name ${this.config.deployment?.domain || 'localhost'};

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
`;

    fs.writeFileSync(path.join(deploymentDir, 'nginx.conf'), nginxConfig.trim());

    console.log('📄 Generated Docker deployment configuration');
  }

  private async generateKubernetesDeployment(deploymentDir: string): Promise<void> {
    const k8sDir = path.join(deploymentDir, 'k8s');
    fs.mkdirSync(k8sDir, { recursive: true });

    // Deployment manifest
    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: `${this.config.app.name}-deployment`,
        labels: {
          app: this.config.app.name
        }
      },
      spec: {
        replicas: 3,
        selector: {
          matchLabels: {
            app: this.config.app.name
          }
        },
        template: {
          metadata: {
            labels: {
              app: this.config.app.name
            }
          },
          spec: {
            containers: [
              {
                name: this.config.app.name,
                image: `${this.config.app.name}:latest`,
                ports: [
                  {
                    containerPort: 3000
                  }
                ],
                env: Object.entries(this.buildEnvironmentVariables()).map(([key, value]) => ({
                  name: key,
                  value: value
                })),
                resources: {
                  requests: {
                    memory: '256Mi',
                    cpu: '250m'
                  },
                  limits: {
                    memory: '512Mi',
                    cpu: '500m'
                  }
                },
                livenessProbe: {
                  httpGet: {
                    path: '/health',
                    port: 3000
                  },
                  initialDelaySeconds: 30,
                  periodSeconds: 10
                },
                readinessProbe: {
                  httpGet: {
                    path: '/health',
                    port: 3000
                  },
                  initialDelaySeconds: 5,
                  periodSeconds: 5
                }
              }
            ]
          }
        }
      }
    };

    fs.writeFileSync(
      path.join(k8sDir, 'deployment.yaml'),
      JSON.stringify(deployment, null, 2)
    );

    // Service manifest
    const service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: `${this.config.app.name}-service`
      },
      spec: {
        selector: {
          app: this.config.app.name
        },
        ports: [
          {
            protocol: 'TCP',
            port: 80,
            targetPort: 3000
          }
        ],
        type: 'ClusterIP'
      }
    };

    fs.writeFileSync(
      path.join(k8sDir, 'service.yaml'),
      JSON.stringify(service, null, 2)
    );

    // Ingress manifest
    const ingress = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: `${this.config.app.name}-ingress`,
        annotations: {
          'kubernetes.io/ingress.class': 'nginx',
          'cert-manager.io/cluster-issuer': 'letsencrypt-prod'
        }
      },
      spec: {
        tls: [
          {
            hosts: [this.config.deployment?.domain || 'example.com'],
            secretName: `${this.config.app.name}-tls`
          }
        ],
        rules: [
          {
            host: this.config.deployment?.domain || 'example.com',
            http: {
              paths: [
                {
                  path: '/',
                  pathType: 'Prefix',
                  backend: {
                    service: {
                      name: `${this.config.app.name}-service`,
                      port: {
                        number: 80
                      }
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    };

    fs.writeFileSync(
      path.join(k8sDir, 'ingress.yaml'),
      JSON.stringify(ingress, null, 2)
    );

    console.log('📄 Generated Kubernetes deployment configuration');
  }

  private async generateGenericDeployment(deploymentDir: string): Promise<void> {
    const deployScript = `#!/bin/bash
set -e

echo "🚀 Deploying ${this.config.app.displayName}..."

# Build application
echo "📦 Building application..."
npm run build

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:migrate

# Start application
echo "▶️  Starting application..."
npm start
`;

    fs.writeFileSync(path.join(deploymentDir, 'deploy.sh'), deployScript.trim());
    fs.chmodSync(path.join(deploymentDir, 'deploy.sh'), '755');

    console.log('📄 Generated generic deployment configuration');
  }

  private async generateDeploymentScripts(deploymentDir: string): Promise<void> {
    const scriptsDir = path.join(deploymentDir, 'scripts');
    fs.mkdirSync(scriptsDir, { recursive: true });

    // Pre-deployment script
    const preDeployScript = `#!/bin/bash
set -e

echo "🔄 Running pre-deployment checks..."

# Check environment variables
required_vars=(${Object.keys(this.buildEnvironmentVariables()).map(key => `"${key}"`).join(' ')})

for var in "\${required_vars[@]}"; do
  if [[ -z "\${!var}" ]]; then
    echo "❌ Required environment variable \$var is not set"
    exit 1
  fi
done

echo "✅ Pre-deployment checks passed"
`;

    fs.writeFileSync(path.join(scriptsDir, 'pre-deploy.sh'), preDeployScript.trim());
    fs.chmodSync(path.join(scriptsDir, 'pre-deploy.sh'), '755');

    // Post-deployment script
    const postDeployScript = `#!/bin/bash
set -e

echo "🔄 Running post-deployment tasks..."

# Health check
echo "🩺 Performing health check..."
max_attempts=30
attempt=0

while [ \$attempt -lt \$max_attempts ]; do
  if curl -f -s "\${HEALTH_CHECK_URL:-http://localhost:3000/health}" > /dev/null; then
    echo "✅ Application is healthy"
    break
  fi
  
  attempt=\$((attempt + 1))
  echo "⏳ Waiting for application to be ready... (\$attempt/\$max_attempts)"
  sleep 10
done

if [ \$attempt -eq \$max_attempts ]; then
  echo "❌ Application failed to become healthy"
  exit 1
fi

echo "🎉 Deployment completed successfully!"
`;

    fs.writeFileSync(path.join(scriptsDir, 'post-deploy.sh'), postDeployScript.trim());
    fs.chmodSync(path.join(scriptsDir, 'post-deploy.sh'), '755');

    // Rollback script
    const rollbackScript = `#!/bin/bash
set -e

PREVIOUS_VERSION=\${1:-"previous"}

echo "🔄 Rolling back to version: \$PREVIOUS_VERSION"

# Implementation depends on deployment platform
case "\${DEPLOYMENT_PLATFORM:-docker}" in
  "docker")
    docker-compose -f deployment/docker-compose.prod.yml down
    docker tag ${this.config.app.name}:\$PREVIOUS_VERSION ${this.config.app.name}:latest
    docker-compose -f deployment/docker-compose.prod.yml up -d
    ;;
  "kubernetes")
    kubectl rollout undo deployment/${this.config.app.name}-deployment
    ;;
  *)
    echo "⚠️  Manual rollback required for platform: \$DEPLOYMENT_PLATFORM"
    ;;
esac

echo "✅ Rollback completed"
`;

    fs.writeFileSync(path.join(scriptsDir, 'rollback.sh'), rollbackScript.trim());
    fs.chmodSync(path.join(scriptsDir, 'rollback.sh'), '755');

    console.log('📄 Generated deployment scripts');
  }

  private async generateCICDConfig(outputDir: string): Promise<void> {
    const cicdDir = path.join(outputDir, '.github', 'workflows');
    fs.mkdirSync(cicdDir, { recursive: true });

    const githubWorkflow = {
      name: 'CI/CD Pipeline',
      on: {
        push: {
          branches: ['main', 'develop']
        },
        pull_request: {
          branches: ['main']
        }
      },
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              uses: 'actions/checkout@v3'
            },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v3',
              with: {
                'node-version': '18',
                cache: 'npm'
              }
            },
            {
              name: 'Install dependencies',
              run: 'npm ci'
            },
            {
              name: 'Run tests',
              run: 'npm test'
            },
            {
              name: 'Run linting',
              run: 'npm run lint'
            }
          ]
        },
        deploy: {
          'runs-on': 'ubuntu-latest',
          needs: 'test',
          if: "github.ref == 'refs/heads/main'",
          steps: [
            {
              uses: 'actions/checkout@v3'
            },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v3',
              with: {
                'node-version': '18',
                cache: 'npm'
              }
            },
            {
              name: 'Install dependencies',
              run: 'npm ci'
            },
            {
              name: 'Build application',
              run: 'npm run build'
            },
            {
              name: 'Deploy to production',
              run: './deployment/scripts/deploy.sh',
              env: this.buildEnvironmentVariables()
            }
          ]
        }
      }
    };

    fs.writeFileSync(
      path.join(cicdDir, 'deploy.yml'),
      JSON.stringify(githubWorkflow, null, 2)
    );

    console.log('📄 Generated CI/CD configuration');
  }

  private buildEnvironmentVariables(): Record<string, string> {
    const env: Record<string, string> = {
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: `$\{DATABASE_URL}`,
      JWT_SECRET: `$\{JWT_SECRET}`
    };

    // Add integration environment variables
    if (this.config.integrations) {
      this.config.integrations.forEach(integration => {
        const envPrefix = integration.name.toUpperCase().replace('-', '_');
        
        if (integration.config?.authentication?.type === 'oauth2') {
          env[`${envPrefix}_CLIENT_ID`] = `$\{${envPrefix}_CLIENT_ID}`;
          env[`${envPrefix}_CLIENT_SECRET`] = `$\{${envPrefix}_CLIENT_SECRET}`;
        } else if (integration.config?.authentication?.type === 'api-key') {
          env[`${envPrefix}_API_KEY`] = `$\{${envPrefix}_API_KEY}`;
        } else if (integration.config?.authentication?.type === 'bearer') {
          env[`${envPrefix}_TOKEN`] = `$\{${envPrefix}_TOKEN}`;
        }
      });
    }

    // Add deployment-specific environment variables
    if (this.config.deployment?.environment_variables) {
      this.config.deployment.environment_variables.forEach((envVar: any) => {
        env[envVar.name] = `$\{${envVar.name}}`;
      });
    }

    return env;
  }

  private toToml(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let result = '';

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result += `${spaces}[${key}]\n`;
        result += this.toToml(value, indent + 1);
      } else if (Array.isArray(value)) {
        if (value.every(item => typeof item === 'object')) {
          value.forEach(item => {
            result += `${spaces}[[${key}]]\n`;
            result += this.toToml(item, indent + 1);
          });
        } else {
          result += `${spaces}${key} = ${JSON.stringify(value)}\n`;
        }
      } else if (typeof value === 'string') {
        result += `${spaces}${key} = "${value}"\n`;
      } else {
        result += `${spaces}${key} = ${value}\n`;
      }
    }

    return result;
  }
}