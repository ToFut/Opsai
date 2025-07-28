import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseUtils {
  private client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await this.client.auth.getUser();
    
    if (error) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }

    return user;
  }

  /**
   * Get current session
   */
  async getCurrentSession() {
    const { data: { session }, error } = await this.client.auth.getSession();
    
    if (error) {
      throw new Error(`Failed to get current session: ${error.message}`);
    }

    return session;
  }

  /**
   * Sign out user
   */
  async signOut() {
    const { error } = await this.client.auth.signOut();
    
    if (error) {
      throw new Error(`Failed to sign out: ${error.message}`);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    
    if (error) {
      throw new Error(`Failed to reset password: ${error.message}`);
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const { error } = await this.client.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: {
    email?: string;
    data?: Record<string, any>;
  }) {
    const { error } = await this.client.auth.updateUser(updates);
    
    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch {
      return false;
    }
  }
} 