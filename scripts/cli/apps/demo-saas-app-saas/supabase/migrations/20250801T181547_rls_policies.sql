
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
