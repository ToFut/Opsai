export declare class SupabaseUtils {
    private client;
    constructor(url: string, anonKey: string);
    /**
     * Get current user
     */
    getCurrentUser(): Promise<import("@supabase/supabase-js").AuthUser>;
    /**
     * Get current session
     */
    getCurrentSession(): Promise<import("@supabase/supabase-js").AuthSession>;
    /**
     * Sign out user
     */
    signOut(): Promise<void>;
    /**
     * Reset password
     */
    resetPassword(email: string): Promise<void>;
    /**
     * Update password
     */
    updatePassword(newPassword: string): Promise<void>;
    /**
     * Update user profile
     */
    updateProfile(updates: {
        email?: string;
        data?: Record<string, any>;
    }): Promise<void>;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): Promise<boolean>;
}
//# sourceMappingURL=supabase-utils.d.ts.map