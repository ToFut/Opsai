import { createClient } from '@supabase/supabase-js'
import type { Application, Customization, AIInsight, PerformanceMetrics, SecurityScore, CodeQuality, UserMetadata } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Environment validation happens below

// Provide safe defaults for development
const SUPABASE_URL = supabaseUrl || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = supabaseAnonKey || 'placeholder-anon-key'

// Only warn in development, don't crash the app
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials missing. Some features may not work.')
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const auth = {
  // Sign up with email confirmation handling
  async signUp(email: string, password: string, userData?: { firstName?: string; lastName?: string }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) throw error
      
      // Since email confirmation is disabled, user should be able to login immediately
      if (data.user && data.session) {
        return { success: true, user: data.user, session: data.session }
      }
      
      // Fallback case
      return { success: true, user: data.user, message: 'Account created successfully!' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Sign in with better error handling
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Your account exists but email is not confirmed. Please contact support or check your Supabase dashboard to confirm the user manually.')
        }
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.')
        }
        throw error
      }
      
      return { success: true, user: data.user, session: data.session }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { user }
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return { session }
    } catch (error) {
      return { session: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { error }
  },

  // Update user profile
  async updateProfile(updates: UserMetadata) {
    const { error } = await supabase.auth.updateUser({
      data: updates
    })
    return { error }
  },

  // Resend confirmation email
  async resendConfirmation(email: string) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) throw error
      return { success: true, message: 'Confirmation email sent!' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Database helper functions
export const db = {
  // Get user's applications with pagination
  getApplications: async (userId: string, page: number = 1, limit: number = 20) => {
    const offset = (page - 1) * limit
    
    const { data, error, count } = await supabase
      .from('applications')
      .select(`
        *,
        customizations (*),
        ai_insights (*),
        performance_metrics (*),
        security_scores (*),
        code_quality (*)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    return { data, error, count }
  },

  // Create new application
  createApplication: async (applicationData: Partial<Application>) => {
    const { data, error } = await supabase
      .from('applications')
      .insert(applicationData)
      .select()
      .single()
    
    return { data, error }
  },

  // Update application
  updateApplication: async (id: string, updates: Partial<Application>) => {
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  // Delete application
  deleteApplication: async (id: string) => {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)
    
    return { error }
  },

  // Get application by ID
  getApplication: async (id: string) => {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        customizations (*),
        ai_insights (*),
        performance_metrics (*),
        security_scores (
          *,
          vulnerabilities (*)
        ),
        code_quality (*)
      `)
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  // Create customization
  createCustomization: async (customizationData: Partial<Customization>) => {
    const { data, error } = await supabase
      .from('customizations')
      .insert(customizationData)
      .select()
      .single()
    
    return { data, error }
  },

  // Create AI insight
  createAIInsight: async (insightData: Partial<AIInsight>) => {
    const { data, error } = await supabase
      .from('ai_insights')
      .insert(insightData)
      .select()
      .single()
    
    return { data, error }
  },

  // Update performance metrics
  updatePerformanceMetrics: async (applicationId: string, metrics: Partial<PerformanceMetrics>) => {
    const { data, error } = await supabase
      .from('performance_metrics')
      .upsert({
        application_id: applicationId,
        ...metrics
      })
      .select()
      .single()
    
    return { data, error }
  },

  // Update security score
  updateSecurityScore: async (applicationId: string, score: Partial<SecurityScore>) => {
    const { data, error } = await supabase
      .from('security_scores')
      .upsert({
        application_id: applicationId,
        ...score
      })
      .select()
      .single()
    
    return { data, error }
  },

  // Update code quality
  updateCodeQuality: async (applicationId: string, quality: Partial<CodeQuality>) => {
    const { data, error } = await supabase
      .from('code_quality')
      .upsert({
        application_id: applicationId,
        ...quality
      })
      .select()
      .single()
    
    return { data, error }
  }
}

// Export default for compatibility
export default supabase 