export declare class PasswordUtils {
    private saltRounds;
    constructor(saltRounds?: number);
    /**
     * Hash password
     */
    hashPassword(password: string): Promise<string>;
    /**
     * Verify password
     */
    verifyPassword(password: string, hash: string): Promise<boolean>;
    /**
     * Generate random password
     */
    generateRandomPassword(length?: number): string;
    /**
     * Validate password strength
     */
    validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=password-utils.d.ts.map