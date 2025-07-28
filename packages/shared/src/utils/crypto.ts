import { createHash, randomBytes, createHmac } from 'crypto';

export function hashString(input: string, algorithm: string = 'sha256'): string {
  return createHash(algorithm).update(input).digest('hex');
}

export function generateSecureRandomString(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

export function generateSecureToken(): string {
  return randomBytes(64).toString('hex');
}

export function createHMAC(message: string, secret: string, algorithm: string = 'sha256'): string {
  return createHmac(algorithm, secret).update(message).digest('hex');
}

export function verifyHMAC(message: string, signature: string, secret: string, algorithm: string = 'sha256'): boolean {
  const expectedSignature = createHMAC(message, secret, algorithm);
  return signature === expectedSignature;
}

export function generateAPIKey(prefix: string = 'opsai'): string {
  const timestamp = Date.now().toString(36);
  const random = generateSecureRandomString(16);
  return `${prefix}_${timestamp}_${random}`;
}

export function maskSensitiveData(data: string, type: 'email' | 'phone' | 'ssn' | 'credit_card'): string {
  switch (type) {
    case 'email':
      const [local, domain] = data.split('@');
      return `${local?.charAt(0) || 'u'}***@${domain}`;
    
    case 'phone':
      return data.replace(/(\d{3})\d{3}(\d{4})/, '$1-***-$2');
    
    case 'ssn':
      return data.replace(/(\d{3})\d{2}(\d{4})/, '$1-**-$2');
    
    case 'credit_card':
      return data.replace(/(\d{4})\d{8}(\d{4})/, '$1-****-****-$2');
    
    default:
      return data;
  }
}

export function generateChecksum(data: string | Buffer): string {
  return createHash('md5').update(data).digest('hex');
}

export function validateChecksum(data: string | Buffer, expectedChecksum: string): boolean {
  const actualChecksum = generateChecksum(data);
  return actualChecksum === expectedChecksum;
}

export function encodeBase64(data: string): string {
  return Buffer.from(data, 'utf8').toString('base64');
}

export function decodeBase64(data: string): string {
  return Buffer.from(data, 'base64').toString('utf8');
}

export function generatePasswordHash(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || generateSecureRandomString(16);
  const hash = createHmac('sha256', generatedSalt).update(password).digest('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: expectedHash } = generatePasswordHash(password, salt);
  return hash === expectedHash;
}

export function generateJWTSecret(): string {
  return randomBytes(64).toString('base64');
}

export function createSignature(data: any, secret: string): string {
  const jsonString = JSON.stringify(data);
  return createHMAC(jsonString, secret);
}

export function verifySignature(data: any, signature: string, secret: string): boolean {
  const expectedSignature = createSignature(data, secret);
  return signature === expectedSignature;
} 