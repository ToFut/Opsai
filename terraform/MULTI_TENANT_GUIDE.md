# Multi-Tenant Data Separation Guide

## Current Setup (Shared Tables)

By default, all users' data goes into the same tables:

```sql
-- All users mixed together
public.stripe_customers
public.github_repositories
public.google_analytics_website_overview
```

## Recommended: Schema Per User

### 1. Update Terraform for Each User

```bash
# When user connects Stripe
terraform apply \
  -var="user_id=123" \
  -var="stripe_api_key=sk_live_userkey"

# Creates schema: user_123
# Tables: user_123.stripe_customers, user_123.stripe_charges
```

### 2. In Your Supabase

```sql
-- Each user has isolated schema
user_123.stripe_customers    -- User 123's data only
user_456.stripe_customers    -- User 456's data only
user_789.stripe_customers    -- User 789's data only

-- Query specific user's data
SELECT * FROM user_123.stripe_customers;
```

### 3. Implementation Options

#### Option A: Terraform Workspace Per User
```bash
# Create workspace for each user
terraform workspace new user_123
terraform apply -var="stripe_api_key=sk_live_xxx"

terraform workspace new user_456  
terraform apply -var="stripe_api_key=sk_live_yyy"
```

#### Option B: Dynamic Terraform Runs
```javascript
// In your backend after OAuth
async function setupUserAirbyte(userId, credentials) {
  const tfvars = {
    user_id: userId,
    stripe_api_key: credentials.stripe,
    github_token: credentials.github,
    // etc
  };
  
  // Run terraform with user-specific vars
  await exec(`terraform apply -var="user_id=${userId}"`);
}
```

#### Option C: Separate Airbyte Workspace
```javascript
// Create new Airbyte workspace per customer
const workspace = await airbyte.createWorkspace({
  name: `customer_${userId}`,
  // Each customer completely isolated
});
```

## SQL Access Patterns

### With Schema Separation:
```sql
-- User 123 sees only their data
SET search_path TO user_123;
SELECT * FROM stripe_customers;

-- Admin sees all users
SELECT 
  'user_123' as user_id,
  COUNT(*) as customer_count
FROM user_123.stripe_customers
UNION ALL
SELECT 
  'user_456' as user_id,
  COUNT(*) 
FROM user_456.stripe_customers;
```

### With Row-Level Security:
```sql
-- Alternative: Use RLS policies
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON public.stripe_customers
  FOR ALL USING (metadata->>'user_id' = current_user_id());
```

## Pros/Cons

### Schema Per User
✅ Complete data isolation
✅ Easy to delete user data (DROP SCHEMA)
✅ Clear billing/usage per user
❌ More complex Terraform management
❌ Many schemas to manage

### Shared Tables with Filtering
✅ Simple setup
✅ Easy cross-user analytics
❌ Risk of data leaks
❌ Harder to delete user data

## Recommended Architecture

1. **Use Schema Per User** for sensitive data (Stripe, banking)
2. **Use Shared Tables** for non-sensitive data (public GitHub repos)
3. **Add user_id to connection names** for easy tracking
4. **Use Terraform workspaces** for large customers
5. **Monitor costs** per schema/user