export declare function hashString(input: string, algorithm?: string): string;
export declare function generateSecureRandomString(length?: number): string;
export declare function generateSecureToken(): string;
export declare function createHMAC(message: string, secret: string, algorithm?: string): string;
export declare function verifyHMAC(message: string, signature: string, secret: string, algorithm?: string): boolean;
export declare function generateAPIKey(prefix?: string): string;
export declare function maskSensitiveData(data: string, type: 'email' | 'phone' | 'ssn' | 'credit_card'): string;
export declare function generateChecksum(data: string | Buffer): string;
export declare function validateChecksum(data: string | Buffer, expectedChecksum: string): boolean;
export declare function encodeBase64(data: string): string;
export declare function decodeBase64(data: string): string;
export declare function generatePasswordHash(password: string, salt?: string): {
    hash: string;
    salt: string;
};
export declare function verifyPassword(password: string, hash: string, salt: string): boolean;
export declare function generateJWTSecret(): string;
export declare function createSignature(data: any, secret: string): string;
export declare function verifySignature(data: any, signature: string, secret: string): boolean;
//# sourceMappingURL=crypto.d.ts.map