import { YAMLConfig } from '@opsai/yaml-validator'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface AuthProvider {
  id: string
  tenantId: string
  type: 'email' | 'google' | 'github' | 'microsoft' | 'sso' | 'magic-link'
  name: string
  config: Record<string, any>
  enabled: boolean
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AuthRole {
  id: string
  tenantId: string
  name: string
  description: string
  permissions: string[]
  inherits: string[]
  isDefault: boolean
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AuthPermission {
  id: string
  tenantId: string
  name: string
  description: string
  resource: string
  action: string
  conditions: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser {
  id: string
  tenantId: string
  email: string
  name: string
  avatar?: string
  role: string
  permissions: string[]
  status: 'active' | 'inactive' | 'suspended'
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AuthSession {
  id: string
  userId: string
  tenantId: string
  token: string
  refreshToken: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

export interface AuthPolicy {
  id: string
  tenantId: string
  name: string
  description: string
  resource: string
  effect: 'allow' | 'deny'
  conditions: Record<string, any>
  priority: number
  createdAt: Date
  updatedAt: Date
}

export class AuthManager {
  private supabase: SupabaseClient
  private providers: Map<string, AuthProvider[]> = new Map()
  private roles: Map<string, AuthRole[]> = new Map()
  private permissions: Map<string, AuthPermission[]> = new Map()
  private users: Map<string, AuthUser[]> = new Map()
  private sessions: Map<string, AuthSession[]> = new Map()
  private policies: Map<string, AuthPolicy[]> = new Map()

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    )
  }

  // Provider Management
  async createProvider(providerData: Omit<AuthProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuthProvider> {
    const provider: AuthProvider = {
      id: this.generateId(),
      ...providerData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!this.providers.has(provider.tenantId)) {
      this.providers.set(provider.tenantId, [])
    }

    this.providers.get(provider.tenantId)!.push(provider)
    return provider
  }

  async getProviders(tenantId: string): Promise<AuthProvider[]> {
    return this.providers.get(tenantId) || []
  }

  async updateProvider(providerId: string, updates: Partial<AuthProvider>): Promise<AuthProvider> {
    for (const [tenantId, providers] of this.providers.entries()) {
      const providerIndex = providers.findIndex(p => p.id === providerId)
      if (providerIndex !== -1) {
        providers[providerIndex] = { ...providers[providerIndex], ...updates, updatedAt: new Date() }
        return providers[providerIndex]
      }
    }
    throw new Error('Provider not found')
  }

  // Role Management
  async createRole(roleData: Omit<AuthRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuthRole> {
    const role: AuthRole = {
      id: this.generateId(),
      ...roleData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!this.roles.has(role.tenantId)) {
      this.roles.set(role.tenantId, [])
    }

    this.roles.get(role.tenantId)!.push(role)
    return role
  }

  async getRoles(tenantId: string): Promise<AuthRole[]> {
    return this.roles.get(tenantId) || []
  }

  async updateRole(roleId: string, updates: Partial<AuthRole>): Promise<AuthRole> {
    for (const [tenantId, roles] of this.roles.entries()) {
      const roleIndex = roles.findIndex(r => r.id === roleId)
      if (roleIndex !== -1) {
        roles[roleIndex] = { ...roles[roleIndex], ...updates, updatedAt: new Date() }
        return roles[roleIndex]
      }
    }
    throw new Error('Role not found')
  }

  // Permission Management
  async createPermission(permissionData: Omit<AuthPermission, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuthPermission> {
    const permission: AuthPermission = {
      id: this.generateId(),
      ...permissionData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!this.permissions.has(permission.tenantId)) {
      this.permissions.set(permission.tenantId, [])
    }

    this.permissions.get(permission.tenantId)!.push(permission)
    return permission
  }

  async getPermissions(tenantId: string): Promise<AuthPermission[]> {
    return this.permissions.get(tenantId) || []
  }

  // User Management
  async createUser(userData: Omit<AuthUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuthUser> {
    const user: AuthUser = {
      id: this.generateId(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!this.users.has(user.tenantId)) {
      this.users.set(user.tenantId, [])
    }

    this.users.get(user.tenantId)!.push(user)
    return user
  }

  async getUser(userId: string): Promise<AuthUser | null> {
    for (const [tenantId, users] of this.users.entries()) {
      const user = users.find(u => u.id === userId)
      if (user) return user
    }
    return null
  }

  async getUserByEmail(tenantId: string, email: string): Promise<AuthUser | null> {
    const users = this.users.get(tenantId) || []
    return users.find(u => u.email === email) || null
  }

  async updateUser(userId: string, updates: Partial<AuthUser>): Promise<AuthUser> {
    for (const [tenantId, users] of this.users.entries()) {
      const userIndex = users.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date() }
        return users[userIndex]
      }
    }
    throw new Error('User not found')
  }

  // Session Management
  async createSession(sessionData: Omit<AuthSession, 'id' | 'createdAt'>): Promise<AuthSession> {
    const session: AuthSession = {
      id: this.generateId(),
      ...sessionData,
      createdAt: new Date()
    }

    if (!this.sessions.has(session.tenantId)) {
      this.sessions.set(session.tenantId, [])
    }

    this.sessions.get(session.tenantId)!.push(session)
    return session
  }

  async getSession(sessionId: string): Promise<AuthSession | null> {
    for (const [tenantId, sessions] of this.sessions.entries()) {
      const session = sessions.find(s => s.id === sessionId)
      if (session) return session
    }
    return null
  }

  async validateSession(token: string): Promise<AuthSession | null> {
    for (const [tenantId, sessions] of this.sessions.entries()) {
      const session = sessions.find(s => s.token === token && s.expiresAt > new Date())
      if (session) return session
    }
    return null
  }

  async revokeSession(sessionId: string): Promise<void> {
    for (const [tenantId, sessions] of this.sessions.entries()) {
      const sessionIndex = sessions.findIndex(s => s.id === sessionId)
      if (sessionIndex !== -1) {
        sessions.splice(sessionIndex, 1)
        return
      }
    }
  }

  // Policy Management
  async createPolicy(policyData: Omit<AuthPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuthPolicy> {
    const policy: AuthPolicy = {
      id: this.generateId(),
      ...policyData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!this.policies.has(policy.tenantId)) {
      this.policies.set(policy.tenantId, [])
    }

    this.policies.get(policy.tenantId)!.push(policy)
    return policy
  }

  async getPolicies(tenantId: string): Promise<AuthPolicy[]> {
    return this.policies.get(tenantId) || []
  }

  // Setup Authentication
  async setupAuth(tenantId: string, config: YAMLConfig): Promise<void> {
    try {
      console.log(`Setting up authentication for tenant: ${tenantId}`)

      // Create default roles
      await this.setupDefaultRoles(tenantId)

      // Create default permissions
      await this.setupDefaultPermissions(tenantId)

      // Setup auth providers
      if (config.auth) {
        await this.setupAuthProviders(tenantId, config.auth)
      } else {
        await this.setupDefaultAuth(tenantId)
      }

      // Setup policies
      await this.setupDefaultPolicies(tenantId)

      console.log(`✅ Authentication setup completed for tenant: ${tenantId}`)

    } catch (error) {
      console.error(`❌ Authentication setup failed: ${error}`)
      throw error
    }
  }

  async setupDefaultAuth(tenantId: string): Promise<void> {
    // Setup default email authentication
    await this.createProvider({
      tenantId,
      type: 'email',
      name: 'Email Authentication',
      config: {
        confirmEmail: true,
        allowSignUp: true,
        passwordMinLength: 8
      },
      enabled: true,
      isDefault: true
    })
  }

  private async setupDefaultRoles(tenantId: string): Promise<void> {
    const defaultRoles = [
      {
        name: 'admin',
        description: 'Administrator with full access',
        permissions: ['*'],
        inherits: [],
        isDefault: false,
        isSystem: true
      },
      {
        name: 'user',
        description: 'Regular user with basic access',
        permissions: ['read:own', 'write:own'],
        inherits: [],
        isDefault: true,
        isSystem: true
      },
      {
        name: 'manager',
        description: 'Manager with elevated access',
        permissions: ['read:all', 'write:all', 'delete:own'],
        inherits: ['user'],
        isDefault: false,
        isSystem: true
      }
    ]

    for (const role of defaultRoles) {
      await this.createRole({
        tenantId,
        ...role
      })
    }
  }

  private async setupDefaultPermissions(tenantId: string): Promise<void> {
    const defaultPermissions = [
      {
        name: 'read:own',
        description: 'Read own data',
        resource: '*',
        action: 'read',
        conditions: { owner: 'user.id' }
      },
      {
        name: 'write:own',
        description: 'Write own data',
        resource: '*',
        action: 'write',
        conditions: { owner: 'user.id' }
      },
      {
        name: 'read:all',
        description: 'Read all data',
        resource: '*',
        action: 'read',
        conditions: {}
      },
      {
        name: 'write:all',
        description: 'Write all data',
        resource: '*',
        action: 'write',
        conditions: {}
      },
      {
        name: 'delete:own',
        description: 'Delete own data',
        resource: '*',
        action: 'delete',
        conditions: { owner: 'user.id' }
      },
      {
        name: 'delete:all',
        description: 'Delete all data',
        resource: '*',
        action: 'delete',
        conditions: {}
      }
    ]

    for (const permission of defaultPermissions) {
      await this.createPermission({
        tenantId,
        ...permission
      })
    }
  }

  private async setupAuthProviders(tenantId: string, authConfig: any): Promise<void> {
    for (const provider of authConfig.providers) {
      await this.createProvider({
        tenantId,
        type: provider.type,
        name: `${provider.type.charAt(0).toUpperCase() + provider.type.slice(1)} Authentication`,
        config: provider.config || {},
        enabled: provider.enabled !== false,
        isDefault: provider.type === 'email'
      })
    }
  }

  private async setupDefaultPolicies(tenantId: string): Promise<void> {
    const defaultPolicies = [
      {
        name: 'Allow admin access',
        description: 'Allow administrators full access',
        resource: '*',
        effect: 'allow',
        conditions: { role: 'admin' },
        priority: 100
      },
      {
        name: 'Allow user own data',
        description: 'Allow users to access their own data',
        resource: '*',
        effect: 'allow',
        conditions: { owner: 'user.id' },
        priority: 50
      },
      {
        name: 'Deny unauthorized access',
        description: 'Deny access to unauthorized users',
        resource: '*',
        effect: 'deny',
        conditions: {},
        priority: 0
      }
    ]

    for (const policy of defaultPolicies) {
      await this.createPolicy({
        tenantId,
        ...policy
      })
    }
  }

  // Authentication Methods
  async authenticate(email: string, password: string, tenantId: string): Promise<AuthSession | null> {
    try {
      // Find user
      const user = await this.getUserByEmail(tenantId, email)
      if (!user || user.status !== 'active') {
        return null
      }

      // Verify password (in production, use proper password hashing)
      // This is a simplified version
      if (password !== 'password') { // Replace with proper password verification
        return null
      }

      // Create session
      const session = await this.createSession({
        userId: user.id,
        tenantId,
        token: this.generateToken(),
        refreshToken: this.generateToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      })

      // Update user last login
      await this.updateUser(user.id, { lastLoginAt: new Date() })

      return session

    } catch (error) {
      console.error(`Authentication failed: ${error}`)
      return null
    }
  }

  async authenticateWithProvider(provider: string, token: string, tenantId: string): Promise<AuthSession | null> {
    try {
      // Verify provider token
      const userInfo = await this.verifyProviderToken(provider, token)
      if (!userInfo) {
        return null
      }

      // Find or create user
      let user = await this.getUserByEmail(tenantId, userInfo.email)
      if (!user) {
        user = await this.createUser({
          tenantId,
          email: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.avatar,
          role: 'user',
          permissions: ['read:own', 'write:own'],
          status: 'active'
        })
      }

      // Create session
      const session = await this.createSession({
        userId: user.id,
        tenantId,
        token: this.generateToken(),
        refreshToken: this.generateToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      })

      // Update user last login
      await this.updateUser(user.id, { lastLoginAt: new Date() })

      return session

    } catch (error) {
      console.error(`Provider authentication failed: ${error}`)
      return null
    }
  }

  async refreshSession(refreshToken: string): Promise<AuthSession | null> {
    try {
      // Find session by refresh token
      for (const [tenantId, sessions] of this.sessions.entries()) {
        const session = sessions.find(s => s.refreshToken === refreshToken)
        if (session) {
          // Create new session
          const newSession = await this.createSession({
            userId: session.userId,
            tenantId: session.tenantId,
            token: this.generateToken(),
            refreshToken: this.generateToken(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          })

          // Revoke old session
          await this.revokeSession(session.id)

          return newSession
        }
      }

      return null

    } catch (error) {
      console.error(`Session refresh failed: ${error}`)
      return null
    }
  }

  // Authorization Methods
  async checkPermission(userId: string, permission: string, resource: string, action: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId)
      if (!user) return false

      // Get user's role
      const role = await this.getRoleByName(user.tenantId, user.role)
      if (!role) return false

      // Check if role has wildcard permission
      if (role.permissions.includes('*')) {
        return true
      }

      // Check specific permission
      if (role.permissions.includes(permission)) {
        return true
      }

      // Check inherited permissions
      for (const inheritedRole of role.inherits) {
        const inheritedRoleObj = await this.getRoleByName(user.tenantId, inheritedRole)
        if (inheritedRoleObj && inheritedRoleObj.permissions.includes(permission)) {
          return true
        }
      }

      return false

    } catch (error) {
      console.error(`Permission check failed: ${error}`)
      return false
    }
  }

  async evaluatePolicy(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId)
      if (!user) return false

      const policies = await this.getPolicies(user.tenantId)
      const sortedPolicies = policies.sort((a, b) => b.priority - a.priority)

      for (const policy of sortedPolicies) {
        if (policy.resource === '*' || policy.resource === resource) {
          const matches = await this.evaluatePolicyConditions(policy, user)
          if (matches) {
            return policy.effect === 'allow'
          }
        }
      }

      return false

    } catch (error) {
      console.error(`Policy evaluation failed: ${error}`)
      return false
    }
  }

  // Utility Methods
  private async getRoleByName(tenantId: string, roleName: string): Promise<AuthRole | null> {
    const roles = this.roles.get(tenantId) || []
    return roles.find(r => r.name === roleName) || null
  }

  private async verifyProviderToken(provider: string, token: string): Promise<any> {
    // This would verify the token with the respective provider
    // For now, return a mock user info
    return {
      email: 'user@example.com',
      name: 'Test User',
      avatar: 'https://example.com/avatar.jpg'
    }
  }

  private async evaluatePolicyConditions(policy: AuthPolicy, user: AuthUser): Promise<boolean> {
    // Simple condition evaluation
    // In production, this would be more sophisticated
    return true
  }

  private generateToken(): string {
    return Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15)
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
} 