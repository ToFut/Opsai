# 🔧 Fix Airbyte → Supabase Direct Sync

You're absolutely correct! **Airbyte should sync data directly to Supabase**, not use temp storage.

## Current Problem

The system is using temp storage because:
1. ❌ Airbyte destination points to `localhost` instead of Supabase
2. ❌ Supabase database password missing from env
3. ❌ No tables exist in Supabase for Airbyte to sync to

## Solution: 3 Steps

### Step 1: Add Supabase DB Password to .env.local

Add this line to your `.env.local` file:
```bash
SUPABASE_DB_PASSWORD=your_supabase_database_password
```

**To get your Supabase password:**
1. Go to: https://supabase.com/dashboard/project/dqmufpexuuvlulpilirt/settings/database
2. Copy the password from "Connection String"

### Step 2: Create Tables in Supabase (2 minutes)

1. Go to: https://supabase.com/dashboard/project/dqmufpexuuvlulpilirt/editor
2. Click "SQL Editor" → "New Query"
3. Paste this SQL:

```sql
-- Tables for Airbyte to sync provider data directly
CREATE TABLE IF NOT EXISTS github_repositories (
  id BIGINT PRIMARY KEY,
  tenant_id VARCHAR(255) DEFAULT 'default',
  name VARCHAR(255),
  full_name VARCHAR(255),
  stargazers_count INTEGER,
  forks_count INTEGER,
  open_issues INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS github_users (
  id BIGINT PRIMARY KEY,
  tenant_id VARCHAR(255) DEFAULT 'default',
  login VARCHAR(255),
  name VARCHAR(255),
  email VARCHAR(255),
  public_repos INTEGER,
  followers INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS github_issues (
  id BIGINT PRIMARY KEY,
  tenant_id VARCHAR(255) DEFAULT 'default',
  number INTEGER,
  title TEXT,
  state VARCHAR(50),
  created_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables for system metadata
CREATE TABLE IF NOT EXISTS tenant_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  provider VARCHAR(100),
  access_token TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'connected'
);

CREATE TABLE IF NOT EXISTS tenant_data_schemas (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  providers TEXT[],
  entities JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

4. Click "RUN"

### Step 3: Test the Fixed Flow

1. Go to http://localhost:7250/onboarding-v3
2. Connect GitHub
3. **Airbyte will now sync data directly to Supabase tables!**

## How It Works After Fix

```
OAuth Connect → Airbyte Setup → Direct Sync to Supabase
     ↑                ↑                    ↓
  User connects    Airbyte creates    Data appears in:
  to GitHub       sync job to        - github_repositories
                  Supabase           - github_users  
                                    - github_issues
```

## Verify It's Working

After connecting GitHub, check your Supabase tables:
```sql
SELECT COUNT(*) FROM github_repositories WHERE tenant_id = 'default';
SELECT COUNT(*) FROM github_users WHERE tenant_id = 'default';
SELECT COUNT(*) FROM github_issues WHERE tenant_id = 'default';
```

**This will eliminate temp storage completely - all data goes directly from providers → Airbyte → Supabase!** ✅