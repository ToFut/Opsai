import { YamlConfig } from '../../../packages/shared/src/types';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface SupabaseConfig {
  projectId?: string;
  url?: string;
  anonKey?: string;
  serviceKey?: string;
  database: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
  };
  auth: {
    providers: string[];
    redirectUrls: string[];
    jwtSecret?: string;
  };
  storage: {
    enabled: boolean;
    buckets: Array<{
      name: string;
      public: boolean;
      fileSizeLimit?: string;
      allowedMimeTypes?: string[];
    }>;
  };
  realtime: {
    enabled: boolean;
    tables: string[];
  };
}

export class SupabaseGenerator {
  constructor(private config: YamlConfig, private outputDir: string) {}

  async generateSupabaseSetup(): Promise<SupabaseConfig> {
    console.log('🔧 Generating Supabase configuration...');

    // Extract Supabase requirements from YAML
    const supabaseConfig = this.extractSupabaseConfig();
    
    // Generate Supabase project files
    await this.generateSupabaseFiles(supabaseConfig);
    
    // Generate environment configuration
    await this.generateEnvironmentConfig(supabaseConfig);
    
    // Generate database migrations
    await this.generateDatabaseMigrations(supabaseConfig);
    
    // Generate RLS policies
    await this.generateRLSPolicies(supabaseConfig);
    
    // Generate auth configuration
    await this.generateAuthConfig(supabaseConfig);
    
    // Generate storage configuration
    await this.generateStorageConfig(supabaseConfig);
    
    // Generate realtime configuration
    await this.generateRealtimeConfig(supabaseConfig);

    console.log('✅ Supabase configuration generated successfully');
    return supabaseConfig;
  }

  private extractSupabaseConfig(): SupabaseConfig {
    const appName = this.config.vertical?.name || 'app';
    const entities = this.config.entities || {};
    const auth = this.config.authentication || {};
    const features = this.config.features || {};

    // Determine auth providers from config
    const authProviders = [];
    if (auth.providers?.includes('google')) authProviders.push('google');
    if (auth.providers?.includes('github')) authProviders.push('github');
    if (auth.providers?.includes('azure')) authProviders.push('azure');
    if (auth.providers?.includes('facebook')) authProviders.push('facebook');
    authProviders.push('email'); // Always include email

    // Determine storage buckets needed
    const storageBuckets = [];
    if (features.fileUpload) {
      storageBuckets.push({
        name: 'uploads',
        public: false,
        fileSizeLimit: '50MB',
        allowedMimeTypes: ['image/*', 'application/pdf', 'text/*']
      });
    }
    
    // Add entity-specific buckets
    Object.values(entities).forEach((entity: any) => {
      if (entity.fields) {
        Object.values(entity.fields).forEach((field: any) => {
          if (field.type === 'file' || field.type === 'image') {
            storageBuckets.push({
              name: `${entity.name.toLowerCase()}-files`,
              public: field.public || false,
              fileSizeLimit: field.maxSize || '10MB',
              allowedMimeTypes: field.allowedTypes || ['*/*']
            });
          }
        });
      }
    });

    // Determine realtime tables
    const realtimeTables = [];
    Object.keys(entities).forEach(entityName => {
      const entity = entities[entityName];
      if (entity.realtime || features.realtime) {
        realtimeTables.push(entityName.toLowerCase());
      }
    });

    return {
      projectId: `${appName}-${Date.now()}`,
      database: {
        host: 'localhost',
        port: 54322,
        database: 'postgres',
        username: 'postgres',
        password: 'postgres'
      },
      auth: {
        providers: authProviders,
        redirectUrls: [
          'http://localhost:3000/auth/callback',
          'https://*.vercel.app/auth/callback'
        ]
      },
      storage: {
        enabled: features.fileUpload || storageBuckets.length > 0,
        buckets: storageBuckets
      },
      realtime: {
        enabled: features.realtime || realtimeTables.length > 0,
        tables: realtimeTables
      }
    };
  }

  private async generateSupabaseFiles(supabaseConfig: SupabaseConfig): Promise<void> {
    const supabaseDir = path.join(this.outputDir, 'supabase');
    
    // Create supabase directory structure
    const dirs = [
      'supabase',
      'supabase/migrations',
      'supabase/functions',
      'supabase/config',
      'supabase/seed'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(this.outputDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });

    // Generate supabase/config.toml
    const configToml = `
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
port = 9999
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
refresh_token_rotation_enabled = true
security_captcha_enabled = false
security_captcha_secret = ""
security_update_password_require_reauthentication = false

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

${supabaseConfig.auth.providers.includes('google') ? `
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
redirect_uri = "http://localhost:54321/auth/v1/callback"
` : ''}

${supabaseConfig.auth.providers.includes('github') ? `
[auth.external.github]
enabled = true
client_id = "env(GITHUB_CLIENT_ID)"
secret = "env(GITHUB_CLIENT_SECRET)"
redirect_uri = "http://localhost:54321/auth/v1/callback"
` : ''}

[db]
port = 54322
major_version = 15

[storage]
enabled = ${supabaseConfig.storage.enabled}
port = 54324
file_size_limit = "50MiB"
`;

    fs.writeFileSync(path.join(supabaseDir, 'config.toml'), configToml);

    // Generate package.json scripts for Supabase
    const packageJsonPath = path.join(this.outputDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      packageJson.scripts = {
        ...packageJson.scripts,
        'supabase:start': 'supabase start',
        'supabase:stop': 'supabase stop',
        'supabase:reset': 'supabase db reset',
        'supabase:seed': 'supabase db seed',
        'supabase:migrate': 'supabase db migrate up',
        'supabase:generate-types': 'supabase gen types typescript --local > types/supabase.ts'
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
  }

  private async generateEnvironmentConfig(supabaseConfig: SupabaseConfig): Promise<void> {
    const envContent = `
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres

# OAuth Providers (fill in your actual credentials)
${supabaseConfig.auth.providers.includes('google') ? `
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
` : ''}

${supabaseConfig.auth.providers.includes('github') ? `
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
` : ''}

# Production Supabase (fill in when deploying)
# NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
`;

    fs.writeFileSync(path.join(this.outputDir, '.env.local'), envContent);
    fs.writeFileSync(path.join(this.outputDir, '.env.example'), envContent.replace(/=.*/g, '='));
  }

  private async generateDatabaseMigrations(supabaseConfig: SupabaseConfig): Promise<void> {
    const migrationsDir = path.join(this.outputDir, 'supabase', 'migrations');
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    
    // Generate initial migration
    const initialMigration = `
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid());
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create multi-tenancy support
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security function for multi-tenancy
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.tenant_id', true)::UUID,
    (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

    fs.writeFileSync(
      path.join(migrationsDir, `${timestamp}_initial_setup.sql`),
      initialMigration
    );

    // Generate entity-specific migrations
    const entities = this.config.entities || {};
    Object.entries(entities).forEach(([entityName, entity]: [string, any], index) => {
      const entityTimestamp = new Date(Date.now() + (index + 1) * 1000)
        .toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
      
      const tableName = entityName.toLowerCase();
      let createTableSQL = `
-- Create ${entityName} table
CREATE TABLE IF NOT EXISTS ${tableName} (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
`;

      // Add fields from entity definition
      if (entity.fields) {
        Object.entries(entity.fields).forEach(([fieldName, field]: [string, any]) => {
          const sqlType = this.mapFieldTypeToSQL(field.type);
          const constraints = [];
          
          if (field.required) constraints.push('NOT NULL');
          if (field.unique) constraints.push('UNIQUE');
          if (field.default) constraints.push(`DEFAULT ${field.default}`);
          
          createTableSQL += `  ${fieldName} ${sqlType} ${constraints.join(' ')},\n`;
        });
      }

      createTableSQL += `
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for multi-tenancy
CREATE POLICY "${tableName}_tenant_policy" ON ${tableName}
  USING (tenant_id = get_tenant_id());

-- Create audit trigger
CREATE TRIGGER ${tableName}_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ${tableName}
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ${tableName}_tenant_id_idx ON ${tableName}(tenant_id);
CREATE INDEX IF NOT EXISTS ${tableName}_created_at_idx ON ${tableName}(created_at);
`;

      // Add relationship foreign keys
      if (entity.relationships) {
        entity.relationships.forEach((rel: any) => {
          if (rel.type === 'belongsTo' || rel.type === 'hasOne') {
            const refTable = rel.target.toLowerCase();
            const fkColumn = rel.field || `${refTable}_id`;
            createTableSQL += `
ALTER TABLE ${tableName} 
ADD CONSTRAINT ${tableName}_${fkColumn}_fkey 
FOREIGN KEY (${fkColumn}) REFERENCES ${refTable}(id) ON DELETE CASCADE;
`;
          }
        });
      }

      fs.writeFileSync(
        path.join(migrationsDir, `${entityTimestamp}_create_${tableName}.sql`),
        createTableSQL
      );
    });
  }

  private mapFieldTypeToSQL(fieldType: string): string {
    switch (fieldType) {
      case 'string': return 'TEXT';
      case 'number': return 'NUMERIC';
      case 'integer': return 'INTEGER';
      case 'boolean': return 'BOOLEAN';
      case 'date': return 'DATE';
      case 'datetime': return 'TIMESTAMP WITH TIME ZONE';
      case 'json': return 'JSONB';
      case 'uuid': return 'UUID';
      case 'email': return 'TEXT';
      case 'url': return 'TEXT';
      case 'file': return 'TEXT';
      case 'image': return 'TEXT';
      default: return 'TEXT';
    }
  }

  private async generateRLSPolicies(supabaseConfig: SupabaseConfig): Promise<void> {
    const rlsDir = path.join(this.outputDir, 'supabase', 'migrations');
    const timestamp = new Date(Date.now() + 10000).toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    
    const rlsPolicies = `
-- Advanced RLS Policies

-- User profile access
CREATE POLICY "users_own_profile" ON auth.users
  USING (auth.uid() = id);

-- Tenant admin access
CREATE POLICY "tenant_admin_access" ON tenants
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE tenant_id = tenants.id 
      AND role = 'admin'
    )
  );

-- Audit log access (admins only)
CREATE POLICY "audit_admin_only" ON audit_logs
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE tenant_id = get_tenant_id() 
      AND role IN ('admin', 'owner')
    )
  );
`;

    fs.writeFileSync(
      path.join(rlsDir, `${timestamp}_rls_policies.sql`),
      rlsPolicies
    );
  }

  private async generateAuthConfig(supabaseConfig: SupabaseConfig): Promise<void> {
    const authDir = path.join(this.outputDir, 'lib');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const supabaseClient = `
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Multi-tenant aware client
export const createTenantClient = (tenantId: string) => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-tenant-id': tenantId
      }
    }
  })
}
`;

    fs.writeFileSync(path.join(authDir, 'supabase.ts'), supabaseClient);

    // Generate auth hooks
    const authHooks = `
import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    session,
    loading,
    signIn: (email: string, password: string) => 
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email: string, password: string) => 
      supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
    signInWithProvider: (provider: 'google' | 'github' | 'azure' | 'facebook') =>
      supabase.auth.signInWithOAuth({ provider })
  }
}
`;

    const hooksDir = path.join(this.outputDir, 'hooks');
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }
    fs.writeFileSync(path.join(hooksDir, 'useAuth.ts'), authHooks);
  }

  private async generateStorageConfig(supabaseConfig: SupabaseConfig): Promise<void> {
    if (!supabaseConfig.storage.enabled) return;

    const storageDir = path.join(this.outputDir, 'supabase', 'migrations');
    const timestamp = new Date(Date.now() + 15000).toISOString().replace(/[-:]/g, '').replace(/\..+/, '');

    let storageSQL = `
-- Storage setup
`;

    supabaseConfig.storage.buckets.forEach(bucket => {
      storageSQL += `
-- Create ${bucket.name} bucket
INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public)
VALUES ('${bucket.name}', '${bucket.name}', null, NOW(), NOW(), ${bucket.public})
ON CONFLICT (id) DO NOTHING;

-- Storage policy for ${bucket.name}
CREATE POLICY "${bucket.name}_policy" ON storage.objects
  FOR ALL USING (
    bucket_id = '${bucket.name}' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'service_role')
  );
`;
    });

    fs.writeFileSync(
      path.join(storageDir, `${timestamp}_storage_setup.sql`),
      storageSQL
    );

    // Generate storage utilities
    const storageUtils = `
import { supabase } from './supabase'

export class StorageService {
  static async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options?: { upsert?: boolean }
  ) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, options)

    if (error) throw error
    return data
  }

  static async downloadFile(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) throw error
    return data
  }

  static getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  }

  static async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  }
}
`;

    fs.writeFileSync(
      path.join(this.outputDir, 'lib', 'storage.ts'),
      storageUtils
    );
  }

  private async generateRealtimeConfig(supabaseConfig: SupabaseConfig): Promise<void> {
    if (!supabaseConfig.realtime.enabled) return;

    const realtimeHooks = `
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function useRealtimeSubscription<T = any>(
  table: string,
  filter?: string,
  onInsert?: (payload: RealtimePostgresChangesPayload<T>) => void,
  onUpdate?: (payload: RealtimePostgresChangesPayload<T>) => void,
  onDelete?: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let subscription: any

    const setupSubscription = async () => {
      // Initial data fetch
      let query = supabase.from(table).select('*')
      if (filter) {
        const [column, operator, value] = filter.split(' ')
        query = query.filter(column, operator, value)
      }

      const { data: initialData, error } = await query
      if (!error && initialData) {
        setData(initialData)
      }
      setLoading(false)

      // Setup realtime subscription
      subscription = supabase
        .channel(\`public:\${table}\`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            if (payload.eventType === 'INSERT' && onInsert) {
              onInsert(payload)
              setData(prev => [...prev, payload.new as T])
            } else if (payload.eventType === 'UPDATE' && onUpdate) {
              onUpdate(payload)
              setData(prev => prev.map(item => 
                (item as any).id === (payload.new as any).id ? payload.new as T : item
              ))
            } else if (payload.eventType === 'DELETE' && onDelete) {
              onDelete(payload)
              setData(prev => prev.filter(item => 
                (item as any).id !== (payload.old as any).id
              ))
            }
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [table, filter])

  return { data, loading }
}
`;

    const hooksDir = path.join(this.outputDir, 'hooks');
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }
    fs.writeFileSync(path.join(hooksDir, 'useRealtime.ts'), realtimeHooks);
  }
}