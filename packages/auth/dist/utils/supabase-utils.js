"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseUtils = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
class SupabaseUtils {
    constructor(url, anonKey) {
        this.client = (0, supabase_js_1.createClient)(url, anonKey);
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
    async resetPassword(email) {
        const { error } = await this.client.auth.resetPasswordForEmail(email);
        if (error) {
            throw new Error(`Failed to reset password: ${error.message}`);
        }
    }
    /**
     * Update password
     */
    async updatePassword(newPassword) {
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
    async updateProfile(updates) {
        const { error } = await this.client.auth.updateUser(updates);
        if (error) {
            throw new Error(`Failed to update profile: ${error.message}`);
        }
    }
    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        try {
            const user = await this.getCurrentUser();
            return !!user;
        }
        catch {
            return false;
        }
    }
}
exports.SupabaseUtils = SupabaseUtils;
//# sourceMappingURL=supabase-utils.js.map