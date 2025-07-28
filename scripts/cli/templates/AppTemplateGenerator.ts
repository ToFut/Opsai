import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from '../generators/ConfigParser';

export interface AppTemplate {
  name: string;
  displayName: string;
  description: string;
  category: 'saas' | 'ecommerce' | 'crm' | 'cms' | 'marketplace' | 'custom';
  features: string[];
  config: AppConfig;
}

export class AppTemplateGenerator {
  private templates: Map<string, AppTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // CRM Template
    this.templates.set('crm', {
      name: 'crm',
      displayName: 'Customer Relationship Management',
      description: 'Complete CRM system with lead management, contact tracking, and sales pipeline',
      category: 'crm',
      features: [
        'Lead Management',
        'Contact Management', 
        'Deal Pipeline',
        'Activity Tracking',
        'Email Integration',
        'Report & Analytics'
      ],
      config: this.createCRMConfig()
    });

    // E-commerce Template
    this.templates.set('ecommerce', {
      name: 'ecommerce',
      displayName: 'E-commerce Platform',
      description: 'Full-featured online store with product catalog, orders, and payment processing',
      category: 'ecommerce',
      features: [
        'Product Catalog',
        'Shopping Cart',
        'Order Management',
        'Payment Processing',
        'Inventory Management',
        'Customer Accounts'
      ],
      config: this.createEcommerceConfig()
    });

    // Project Management Template
    this.templates.set('project-management', {
      name: 'project-management',
      displayName: 'Project Management System',
      description: 'Comprehensive project management with tasks, teams, and time tracking',
      category: 'saas',
      features: [
        'Project Planning',
        'Task Management',
        'Team Collaboration',
        'Time Tracking',
        'File Sharing',
        'Progress Reports'
      ],
      config: this.createProjectManagementConfig()
    });

    // Content Management Template
    this.templates.set('cms', {
      name: 'cms',
      displayName: 'Content Management System',
      description: 'Modern CMS with multi-site support, SEO optimization, and media management',
      category: 'cms',
      features: [
        'Content Creation',
        'Multi-site Management',
        'SEO Optimization',
        'Media Library',
        'User Roles',
        'API-first Architecture'
      ],
      config: this.createCMSConfig()
    });

    // Marketplace Template
    this.templates.set('marketplace', {
      name: 'marketplace',
      displayName: 'Multi-vendor Marketplace',
      description: 'Two-sided marketplace platform with vendor management and commission tracking',
      category: 'marketplace',
      features: [
        'Vendor Management',
        'Product Listings',
        'Commission Tracking',
        'Payment Split',
        'Review System',
        'Admin Dashboard'
      ],
      config: this.createMarketplaceConfig()
    });

    // Line Properties Template
    this.templates.set('line-properties', {
      name: 'line-properties',
      displayName: 'Line Properties Vacation Rental Platform',
      description: 'Comprehensive vacation rental management with property listings, reservations, and guest management',
      category: 'saas',
      features: [
        'Property Management',
        'Reservation System',
        'Guest Management',
        'API Integrations (Guesty)',
        'Automated Workflows',
        'Real-time Availability',
        'Booking Confirmations',
        'Token Management'
      ],
      config: this.createLinePropertiesConfig()
    });
  }

  listTemplates(): AppTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(name: string): AppTemplate | undefined {
    return this.templates.get(name);
  }

  async generateFromTemplate(templateName: string, appName: string, outputDir: string): Promise<AppConfig> {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    // Customize the config for the specific application
    const customizedConfig = this.customizeConfig(template.config, appName);

    // Save the customized config
    const configPath = path.join(outputDir, `${appName}-config.yaml`);
    await this.saveConfigAsYaml(customizedConfig, configPath);

    console.log(`✅ Generated ${template.displayName} template config`);
    console.log(`📄 Configuration saved to: ${configPath}`);

    return customizedConfig;
  }

  private customizeConfig(templateConfig: AppConfig, appName: string): AppConfig {
    return {
      ...templateConfig,
      app: {
        ...templateConfig.app,
        name: appName,
        displayName: this.toTitleCase(appName.replace(/-/g, ' ')),
        description: `${templateConfig.app.description} - Generated for ${appName}`
      }
    };
  }

  private createCRMConfig(): AppConfig {
    return {
      app: {
        name: 'crm-system',
        displayName: 'CRM System',
        description: 'Customer Relationship Management system with lead tracking and sales pipeline',
        version: '1.0.0',
        author: 'CORE Platform',
        license: 'MIT'
      },
      database: {
        type: 'postgresql',
        entities: [
          {
            name: 'contact',
            displayName: 'Contacts',
            description: 'Customer and prospect contacts',
            fields: {
              id: { type: 'string', required: true, unique: true },
              firstName: { type: 'string', required: true, ui: { label: 'First Name' } },
              lastName: { type: 'string', required: true, ui: { label: 'Last Name' } },
              email: { 
                type: 'string', 
                required: true, 
                unique: true,
                validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
                ui: { label: 'Email Address' }
              },
              phone: { type: 'string', ui: { label: 'Phone Number' } },
              company: { type: 'string', ui: { label: 'Company' } },
              jobTitle: { type: 'string', ui: { label: 'Job Title' } },
              status: {
                type: 'string',
                required: true,
                default: 'new',
                validation: { enum: ['new', 'qualified', 'customer', 'inactive'] },
                ui: { 
                  widget: 'select',
                  options: [
                    { label: 'New Lead', value: 'new' },
                    { label: 'Qualified Lead', value: 'qualified' },
                    { label: 'Customer', value: 'customer' },
                    { label: 'Inactive', value: 'inactive' }
                  ]
                }
              },
              source: {
                type: 'string',
                validation: { enum: ['website', 'referral', 'advertisement', 'cold-call', 'social-media'] },
                ui: {
                  widget: 'select',
                  options: [
                    { label: 'Website', value: 'website' },
                    { label: 'Referral', value: 'referral' },
                    { label: 'Advertisement', value: 'advertisement' },
                    { label: 'Cold Call', value: 'cold-call' },
                    { label: 'Social Media', value: 'social-media' }
                  ]
                }
              },
              notes: { type: 'string', ui: { widget: 'textarea', label: 'Notes' } },
              createdAt: { type: 'date', required: true }
            }
          },
          {
            name: 'deal',
            displayName: 'Deals',
            description: 'Sales opportunities and deals',
            fields: {
              id: { type: 'string', required: true, unique: true },
              title: { type: 'string', required: true, ui: { label: 'Deal Title' } },
              contactId: {
                type: 'relation',
                required: true,
                relation: { entity: 'contact', type: 'one-to-one', foreignKey: 'contactId' }
              },
              value: { type: 'number', required: true, ui: { label: 'Deal Value ($)' } },
              stage: {
                type: 'string',
                required: true,
                default: 'prospecting',
                validation: { enum: ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'] },
                ui: {
                  widget: 'select',
                  options: [
                    { label: 'Prospecting', value: 'prospecting' },
                    { label: 'Qualification', value: 'qualification' },
                    { label: 'Proposal', value: 'proposal' },
                    { label: 'Negotiation', value: 'negotiation' },
                    { label: 'Closed Won', value: 'closed-won' },
                    { label: 'Closed Lost', value: 'closed-lost' }
                  ]
                }
              },
              probability: { 
                type: 'number', 
                validation: { min: 0, max: 100 },
                ui: { label: 'Win Probability (%)' } 
              },
              expectedCloseDate: { type: 'date', ui: { label: 'Expected Close Date' } },
              notes: { type: 'string', ui: { widget: 'textarea' } },
              createdAt: { type: 'date', required: true }
            }
          }
        ]
      },
      integrations: [
        {
          name: 'email-service',
          type: 'rest',
          config: { baseUrl: 'https://api.emailservice.com' },
          endpoints: [
            { name: 'send-email', method: 'POST', path: '/send' }
          ]
        }
      ],
      workflows: [
        {
          name: 'new-lead-notification',
          displayName: 'New Lead Notification',
          description: 'Send notification when new lead is created',
          trigger: { type: 'event', config: { event: 'contact.created' } },
          steps: [
            {
              name: 'send-notification',
              type: 'api-call',
              config: { integration: 'email-service', endpoint: 'send-email' }
            }
          ]
        }
      ],
      ui: {
        theme: 'default',
        pages: [
          {
            name: 'contacts',
            path: '/contacts',
            title: 'Contacts',
            layout: 'list',
            components: [
              {
                type: 'table',
                config: {
                  entity: 'contact',
                  columns: ['firstName', 'lastName', 'email', 'company', 'status'],
                  actions: ['create', 'edit', 'delete']
                }
              }
            ]
          },
          {
            name: 'deals',
            path: '/deals',
            title: 'Deals',
            layout: 'list',
            components: [
              {
                type: 'table',
                config: {
                  entity: 'deal',
                  columns: ['title', 'value', 'stage', 'probability', 'expectedCloseDate'],
                  actions: ['create', 'edit', 'delete']
                }
              }
            ]
          }
        ]
      },
      features: {
        authentication: true,
        multiTenancy: true,
        notifications: true,
        analytics: true
      }
    };
  }

  private createEcommerceConfig(): AppConfig {
    return {
      app: {
        name: 'ecommerce-store',
        displayName: 'E-commerce Store',
        description: 'Full-featured online store with product catalog and order management',
        version: '1.0.0',
        author: 'CORE Platform',
        license: 'MIT'
      },
      database: {
        type: 'postgresql',
        entities: [
          {
            name: 'product',
            displayName: 'Products',
            description: 'Product catalog items',
            fields: {
              id: { type: 'string', required: true, unique: true },
              name: { type: 'string', required: true, ui: { label: 'Product Name' } },
              description: { type: 'string', ui: { widget: 'textarea' } },
              price: { type: 'number', required: true, ui: { label: 'Price ($)' } },
              sku: { type: 'string', required: true, unique: true, ui: { label: 'SKU' } },
              category: { type: 'string', required: true },
              stock: { type: 'number', required: true, ui: { label: 'Stock Quantity' } },
              images: { type: 'json', ui: { label: 'Product Images' } },
              status: {
                type: 'string',
                required: true,
                default: 'draft',
                validation: { enum: ['draft', 'published', 'archived'] },
                ui: {
                  widget: 'select',
                  options: [
                    { label: 'Draft', value: 'draft' },
                    { label: 'Published', value: 'published' },
                    { label: 'Archived', value: 'archived' }
                  ]
                }
              },
              createdAt: { type: 'date', required: true }
            }
          },
          {
            name: 'order',
            displayName: 'Orders',
            description: 'Customer orders',
            fields: {
              id: { type: 'string', required: true, unique: true },
              orderNumber: { type: 'string', required: true, unique: true },
              customerEmail: { type: 'string', required: true },
              customerName: { type: 'string', required: true },
              items: { type: 'json', required: true, ui: { label: 'Order Items' } },
              subtotal: { type: 'number', required: true },
              tax: { type: 'number', required: true },
              shipping: { type: 'number', required: true },
              total: { type: 'number', required: true },
              status: {
                type: 'string',
                required: true,
                default: 'pending',
                validation: { enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
                ui: {
                  widget: 'select',
                  options: [
                    { label: 'Pending', value: 'pending' },
                    { label: 'Confirmed', value: 'confirmed' },
                    { label: 'Shipped', value: 'shipped' },
                    { label: 'Delivered', value: 'delivered' },
                    { label: 'Cancelled', value: 'cancelled' }
                  ]
                }
              },
              shippingAddress: { type: 'json', ui: { label: 'Shipping Address' } },
              createdAt: { type: 'date', required: true }
            }
          }
        ]
      },
      integrations: [
        {
          name: 'payment-gateway',
          type: 'rest',
          config: { baseUrl: 'https://api.stripe.com' },
          endpoints: [
            { name: 'create-payment-intent', method: 'POST', path: '/v1/payment_intents' }
          ]
        }
      ],
      workflows: [
        {
          name: 'order-confirmation',
          displayName: 'Order Confirmation',
          description: 'Send order confirmation email',
          trigger: { type: 'event', config: { event: 'order.created' } },
          steps: [
            {
              name: 'send-confirmation',
              type: 'api-call',
              config: { template: 'order-confirmation' }
            }
          ]
        }
      ],
      ui: {
        theme: 'default',
        pages: [
          {
            name: 'products',
            path: '/products',
            title: 'Products',
            layout: 'list',
            components: [
              {
                type: 'table',
                config: {
                  entity: 'product',
                  columns: ['name', 'price', 'sku', 'category', 'stock', 'status'],
                  actions: ['create', 'edit', 'delete']
                }
              }
            ]
          },
          {
            name: 'orders',
            path: '/orders',
            title: 'Orders',
            layout: 'list',
            components: [
              {
                type: 'table',
                config: {
                  entity: 'order',
                  columns: ['orderNumber', 'customerName', 'total', 'status', 'createdAt'],
                  actions: ['view', 'edit']
                }
              }
            ]
          }
        ]
      },
      features: {
        authentication: true,
        multiTenancy: false,
        fileUpload: true,
        notifications: true,
        analytics: true
      }
    };
  }

  private createProjectManagementConfig(): AppConfig {
    return {
      app: {
        name: 'project-manager',
        displayName: 'Project Management System',
        description: 'Comprehensive project management with tasks and team collaboration',
        version: '1.0.0',
        author: 'CORE Platform',
        license: 'MIT'
      },
      database: {
        type: 'postgresql',
        entities: [
          {
            name: 'project',
            displayName: 'Projects',
            fields: {
              id: { type: 'string', required: true, unique: true },
              name: { type: 'string', required: true },
              description: { type: 'string', ui: { widget: 'textarea' } },
              status: {
                type: 'string',
                required: true,
                default: 'planning',
                validation: { enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'] }
              },
              startDate: { type: 'date' },
              endDate: { type: 'date' },
              budget: { type: 'number' },
              createdAt: { type: 'date', required: true }
            }
          },
          {
            name: 'task',
            displayName: 'Tasks',
            fields: {
              id: { type: 'string', required: true, unique: true },
              title: { type: 'string', required: true },
              description: { type: 'string', ui: { widget: 'textarea' } },
              projectId: {
                type: 'relation',
                required: true,
                relation: { entity: 'project', type: 'one-to-one' }
              },
              assignedTo: { type: 'string' },
              status: {
                type: 'string',
                required: true,
                default: 'todo',
                validation: { enum: ['todo', 'in-progress', 'review', 'done'] }
              },
              priority: {
                type: 'string',
                default: 'medium',
                validation: { enum: ['low', 'medium', 'high', 'urgent'] }
              },
              dueDate: { type: 'date' },
              estimatedHours: { type: 'number' },
              actualHours: { type: 'number' },
              createdAt: { type: 'date', required: true }
            }
          }
        ]
      },
      integrations: [],
      workflows: [],
      ui: {
        theme: 'default',
        pages: [
          {
            name: 'projects',
            path: '/projects',
            title: 'Projects',
            layout: 'list',
            components: [
              {
                type: 'table',
                config: {
                  entity: 'project',
                  columns: ['name', 'status', 'startDate', 'endDate'],
                  actions: ['create', 'edit', 'delete']
                }
              }
            ]
          },
          {
            name: 'tasks',
            path: '/tasks',
            title: 'Tasks',
            layout: 'list',
            components: [
              {
                type: 'table',
                config: {
                  entity: 'task',
                  columns: ['title', 'status', 'priority', 'assignedTo', 'dueDate'],
                  actions: ['create', 'edit', 'delete']
                }
              }
            ]
          }
        ]
      },
      features: {
        authentication: true,
        multiTenancy: true,
        fileUpload: true,
        notifications: true
      }
    };
  }

  private createCMSConfig(): AppConfig {
    return {
      app: {
        name: 'cms-platform',
        displayName: 'Content Management System',
        description: 'Modern CMS with multi-site support and API-first architecture',
        version: '1.0.0',
        author: 'CORE Platform',
        license: 'MIT'
      },
      database: {
        type: 'postgresql',
        entities: [
          {
            name: 'content',
            displayName: 'Content',
            fields: {
              id: { type: 'string', required: true, unique: true },
              title: { type: 'string', required: true },
              slug: { type: 'string', required: true, unique: true },
              body: { type: 'string', required: true, ui: { widget: 'textarea' } },
              excerpt: { type: 'string', ui: { widget: 'textarea' } },
              type: {
                type: 'string',
                required: true,
                validation: { enum: ['page', 'post', 'product', 'custom'] }
              },
              status: {
                type: 'string',
                required: true,
                default: 'draft',
                validation: { enum: ['draft', 'published', 'archived'] }
              },
              publishedAt: { type: 'date' },
              seoTitle: { type: 'string' },
              seoDescription: { type: 'string' },
              featuredImage: { type: 'string' },
              metadata: { type: 'json' },
              createdAt: { type: 'date', required: true }
            }
          }
        ]
      },
      integrations: [],
      workflows: [],
      ui: {
        theme: 'default',
        pages: [
          {
            name: 'content',
            path: '/content',
            title: 'Content',
            layout: 'list',
            components: [
              {
                type: 'table',
                config: {
                  entity: 'content',
                  columns: ['title', 'type', 'status', 'publishedAt'],
                  actions: ['create', 'edit', 'delete']
                }
              }
            ]
          }
        ]
      },
      features: {
        authentication: true,
        multiTenancy: true,
        fileUpload: true,
        analytics: true
      }
    };
  }

  private createMarketplaceConfig(): AppConfig {
    return {
      app: {
        name: 'marketplace-platform',
        displayName: 'Multi-vendor Marketplace',
        description: 'Two-sided marketplace with vendor management and commission tracking',
        version: '1.0.0',
        author: 'CORE Platform',
        license: 'MIT'
      },
      database: {
        type: 'postgresql',
        entities: [
          {
            name: 'vendor',
            displayName: 'Vendors',
            fields: {
              id: { type: 'string', required: true, unique: true },
              name: { type: 'string', required: true },
              email: { type: 'string', required: true, unique: true },
              companyName: { type: 'string', required: true },
              description: { type: 'string', ui: { widget: 'textarea' } },
              status: {
                type: 'string',
                required: true,
                default: 'pending',
                validation: { enum: ['pending', 'approved', 'suspended', 'rejected'] }
              },
              commissionRate: { type: 'number', required: true, default: 10 },
              createdAt: { type: 'date', required: true }
            }
          },
          {
            name: 'listing',
            displayName: 'Listings',
            fields: {
              id: { type: 'string', required: true, unique: true },
              title: { type: 'string', required: true },
              description: { type: 'string', ui: { widget: 'textarea' } },
              price: { type: 'number', required: true },
              vendorId: {
                type: 'relation',
                required: true,
                relation: { entity: 'vendor', type: 'one-to-one' }
              },
              category: { type: 'string', required: true },
              images: { type: 'json' },
              status: {
                type: 'string',
                required: true,
                default: 'draft',
                validation: { enum: ['draft', 'pending', 'approved', 'rejected'] }
              },
              createdAt: { type: 'date', required: true }
            }
          }
        ]
      },
      integrations: [],
      workflows: [],
      ui: {
        theme: 'default',
        pages: [
          {
            name: 'vendors',
            path: '/vendors',
            title: 'Vendors',
            layout: 'list',
            components: [
              {
                type: 'table',
                config: {
                  entity: 'vendor',
                  columns: ['name', 'companyName', 'status', 'commissionRate'],
                  actions: ['view', 'edit', 'approve', 'suspend']
                }
              }
            ]
          },
          {
            name: 'listings',
            path: '/listings',
            title: 'Listings',
            layout: 'list',
            components: [
              {
                type: 'table',
                config: {
                  entity: 'listing',
                  columns: ['title', 'price', 'category', 'status'],
                  actions: ['view', 'edit', 'approve', 'reject']
                }
              }
            ]
          }
        ]
      },
      features: {
        authentication: true,
        multiTenancy: false,
        fileUpload: true,
        notifications: true,
        analytics: true
      }
    };
  }

  private async saveConfigAsYaml(config: AppConfig, filePath: string): Promise<void> {
    const yaml = await import('js-yaml');
    const yamlContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, yamlContent, 'utf8');
  }

  private createLinePropertiesConfig(): AppConfig {
    return {
      app: {
        name: 'line-properties',
        displayName: 'Line Properties',
        description: 'Line Properties Vacation Rental Platform',
        version: '1.0.0',
        author: 'CORE Platform',
        license: 'MIT'
      },
      database: {
        type: 'postgresql',
        entities: [
          {
            name: 'property',
            displayName: 'Properties',
            description: 'Vacation rental properties',
            fields: {
              id: { type: 'string', required: true, unique: true },
              title: { 
                type: 'string', 
                required: true, 
                ui: { label: 'Property Title' } 
              },
              address: { 
                type: 'string', 
                required: true, 
                ui: { label: 'Address' } 
              },
              city: { 
                type: 'string', 
                required: true, 
                ui: { label: 'City' } 
              },
              price: { 
                type: 'number', 
                required: true, 
                ui: { label: 'Price per Night' } 
              },
              bedrooms: { 
                type: 'number', 
                required: true, 
                ui: { label: 'Bedrooms' } 
              },
              bathrooms: { 
                type: 'number', 
                required: true, 
                ui: { label: 'Bathrooms' } 
              },
              amenities: { 
                type: 'json', 
                ui: { label: 'Amenities' } 
              },
              images: { 
                type: 'json', 
                ui: { label: 'Property Images' } 
              },
              status: {
                type: 'string',
                required: true,
                default: 'available',
                validation: { enum: ['available', 'booked', 'maintenance'] },
                ui: {
                  widget: 'select',
                  options: [
                    { label: 'Available', value: 'available' },
                    { label: 'Booked', value: 'booked' },
                    { label: 'Maintenance', value: 'maintenance' }
                  ]
                }
              },
              createdAt: { type: 'date', required: true }
            }
          },
          {
            name: 'reservation',
            displayName: 'Reservations',
            description: 'Property reservations and bookings',
            fields: {
              id: { type: 'string', required: true, unique: true },
              propertyId: {
                type: 'relation',
                required: true,
                relation: { entity: 'property', type: 'one-to-one', foreignKey: 'propertyId' }
              },
              guestId: {
                type: 'relation',
                required: true,
                relation: { entity: 'guest', type: 'one-to-one', foreignKey: 'guestId' }
              },
              checkIn: { 
                type: 'date', 
                required: true, 
                ui: { label: 'Check-in Date' } 
              },
              checkOut: { 
                type: 'date', 
                required: true, 
                ui: { label: 'Check-out Date' } 
              },
              totalPrice: { 
                type: 'number', 
                required: true, 
                ui: { label: 'Total Price' } 
              },
              status: {
                type: 'string',
                required: true,
                default: 'pending',
                validation: { enum: ['pending', 'confirmed', 'cancelled'] },
                ui: {
                  widget: 'select',
                  options: [
                    { label: 'Pending', value: 'pending' },
                    { label: 'Confirmed', value: 'confirmed' },
                    { label: 'Cancelled', value: 'cancelled' }
                  ]
                }
              },
              createdAt: { type: 'date', required: true }
            }
          },
          {
            name: 'guest',
            displayName: 'Guests',
            description: 'Guest information and profiles',
            fields: {
              id: { type: 'string', required: true, unique: true },
              name: { 
                type: 'string', 
                required: true, 
                ui: { label: 'Guest Name' } 
              },
              email: { 
                type: 'string', 
                required: true, 
                unique: true,
                validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
                ui: { label: 'Email Address' } 
              },
              phone: { 
                type: 'string', 
                ui: { label: 'Phone Number' } 
              },
              createdAt: { type: 'date', required: true }
            }
          }
        ]
      },
      integrations: [
        {
          name: 'guesty-api',
          type: 'rest',
          config: { 
            baseUrl: 'https://open-api.guesty.com/v1',
            authentication: {
              type: 'oauth2',
              clientCredentials: true
            }
          },
          endpoints: [
            { name: 'get-listings', method: 'GET', path: '/listings' },
            { name: 'create-reservation', method: 'POST', path: '/reservations' },
            { name: 'refresh-token', method: 'POST', path: '/oauth2/token' }
          ]
        },
        {
          name: 'email-service',
          type: 'rest',
          config: { baseUrl: 'https://api.emailservice.com' },
          endpoints: [
            { name: 'send-confirmation', method: 'POST', path: '/send' }
          ]
        }
      ],
      workflows: [
        {
          name: 'create-reservation',
          displayName: 'Create Reservation',
          description: 'Handle new property reservation with availability check and confirmation',
          trigger: { type: 'event', config: { event: 'reservation.created' } },
          steps: [
            {
              name: 'validate-availability',
              type: 'database-query',
              config: { 
                query: 'Check property availability for dates',
                entity: 'reservation'
              }
            },
            {
              name: 'update-property-status',
              type: 'database-update',
              config: { 
                entity: 'property',
                field: 'status',
                value: 'booked'
              }
            },
            {
              name: 'send-confirmation-email',
              type: 'api-call',
              config: { 
                integration: 'email-service', 
                endpoint: 'send-confirmation'
              }
            }
          ]
        },
        {
          name: 'refresh-guesty-token',
          displayName: 'Refresh Guesty API Token',
          description: 'Automatically refresh Guesty API authentication token',
          trigger: { type: 'schedule', config: { cron: '0 0 * * *' } },
          steps: [
            {
              name: 'fetch-new-token',
              type: 'api-call',
              config: { 
                integration: 'guesty-api', 
                endpoint: 'refresh-token'
              }
            },
            {
              name: 'update-environment',
              type: 'system-update',
              config: { 
                variable: 'GUESTY_ACCESS_TOKEN'
              }
            }
          ]
        }
      ],
      ui: {
        theme: 'default',
        pages: [
          {
            name: 'properties',
            path: '/properties',
            title: 'Properties',
            layout: 'list',
            components: [
              {
                type: 'table',
                config: {
                  entity: 'property',
                  columns: ['title', 'city', 'price', 'bedrooms', 'bathrooms', 'status'],
                  actions: ['create', 'edit', 'delete', 'view']
                }
              }
            ]
          },
          {
            name: 'reservations',
            path: '/reservations',
            title: 'Reservations',
            layout: 'list',
            components: [
              {
                type: 'table',
                config: {
                  entity: 'reservation',
                  columns: ['checkIn', 'checkOut', 'totalPrice', 'status', 'createdAt'],
                  actions: ['create', 'edit', 'cancel', 'confirm']
                }
              }
            ]
          },
          {
            name: 'guests',
            path: '/guests',
            title: 'Guests',
            layout: 'list',
            components: [
              {
                type: 'table',
                config: {
                  entity: 'guest',
                  columns: ['name', 'email', 'phone', 'createdAt'],
                  actions: ['create', 'edit', 'view']
                }
              }
            ]
          }
        ]
      },
      features: {
        authentication: true,
        multiTenancy: true,
        notifications: true,
        analytics: true,
        fileUpload: true,
        workflows: true,
        integrations: true
      }
    };
  }

  private toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
}