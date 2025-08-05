import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const auth = {
  async signUp(email: string, password: string, userData?: { firstName?: string; lastName?: string }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined
        }
      })
      
      if (error) throw error
      
      if (data.user && data.session) {
        return { success: true, user: data.user, session: data.session }
      }
      
      return { success: true, user: data.user, message: 'Account created successfully!' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Your account exists but email is not confirmed. Please contact support.')
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

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { error }
  },

  async updateProfile(updates: any) {
    const { error } = await supabase.auth.updateUser({
      data: updates
    })
    return { error }
  }
}

export default supabase
