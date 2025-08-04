# Creating OAuth Tables in Supabase

Since we can't directly run SQL migrations, please follow these steps:

## Option 1: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/dqmufpexuuvlulpilirt/editor
2. Click on "SQL Editor" in the left sidebar
3. Copy the entire contents of `setup-oauth-tables.sql`
4. Paste it into the SQL editor
5. Click "Run" to create all tables

## Option 2: Using Supabase CLI (if installed)

```bash
supabase db push --db-url "postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

## Option 3: Using psql directly

```bash
psql "postgresql://postgres.dqmufpexuuvlulpilirt:[YOUR_DB_PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres" -f setup-oauth-tables.sql
```

## What the tables do:

1. **tenant_integrations** - Stores OAuth tokens for each provider
2. **tenant_sample_data** - Stores sample data fetched after OAuth
3. **tenant_data_schemas** - Stores AI-generated database schemas
4. **tenant_dynamic_data** - Stores the organized data
5. **tenant_airbyte_connections** - Tracks Airbyte sync configurations

After creating the tables, the OAuth → Sample Data → DB Organization flow will work!