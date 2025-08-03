import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  jwtSecret: string;
  schema?: string;
  auth?: {
    autoRefreshToken?: boolean;
    persistSession?: boolean;
    detectSessionInUrl?: boolean;
  };
  db?: {
    schema?: string;
  };
  realtime?: {
    params?: Record<string, any>;
  };
}

export class SupabaseConfigManager {
  private static instance: SupabaseConfigManager;
  private config: SupabaseConfig;
  private client: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): SupabaseConfigManager {
    if (!SupabaseConfigManager.instance) {
      SupabaseConfigManager.instance = new SupabaseConfigManager();
    }
    return SupabaseConfigManager.instance;
  }

  private loadConfig(): SupabaseConfig {
    return {
      url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
      schema: process.env.SUPABASE_SCHEMA || 'public',
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      db: {
        schema: process.env.SUPABASE_DB_SCHEMA || 'public'
      }
    };
  }

  public getConfig(): SupabaseConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<SupabaseConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Reset clients to force recreation with new config
    this.client = null;
    this.adminClient = null;
  }

  public getClient(): SupabaseClient {
    if (!this.client) {
      if (!this.config.url || !this.config.anonKey) {
        throw new Error('Supabase URL and anonymous key are required');
      }

      this.client = createClient(this.config.url, this.config.anonKey, {
        auth: this.config.auth,
        db: this.config.db,
        realtime: this.config.realtime
      });
    }
    return this.client;
  }

  public getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      if (!this.config.url || !this.config.serviceRoleKey) {
        throw new Error('Supabase URL and service role key are required for admin client');
      }

      this.adminClient = createClient(this.config.url, this.config.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: this.config.db
      });
    }
    return this.adminClient;
  }

  public isConfigured(): boolean {
    return !!(this.config.url && this.config.anonKey);
  }

  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.url) {
      errors.push('Supabase URL is required');
    }

    if (!this.config.anonKey) {
      errors.push('Supabase anonymous key is required');
    }

    if (!this.config.jwtSecret) {
      errors.push('JWT secret is required');
    }

    try {
      if (this.config.url) {
        new URL(this.config.url);
      }
    } catch {
      errors.push('Supabase URL must be a valid URL');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  public async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();
      const { data, error } = await client.from('_supabase_test').select('*').limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = relation does not exist (expected)
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to connect to Supabase' 
      };
    }
  }

  public getRLSPolicies() {
    return {
      tenantIsolation: `
        CREATE POLICY tenant_isolation ON {table_name}
        FOR ALL
        USING (tenant_id = auth.jwt() ->> 'tenant_id')
        WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');
      `,
      userAccess: `
        CREATE POLICY user_access ON {table_name}
        FOR ALL
        USING (
          user_id = auth.uid() OR
          tenant_id = auth.jwt() ->> 'tenant_id'
        );
      `,
      roleBasedAccess: `
        CREATE POLICY role_based_access ON {table_name}
        FOR {operation}
        USING (
          EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = auth.uid()
            AND ur.tenant_id = auth.jwt() ->> 'tenant_id'
            AND p.resource = '{resource}'
            AND p.action = '{action}'
          )
        );
      `
    };
  }
}

export const supabaseConfig = SupabaseConfigManager.getInstance();