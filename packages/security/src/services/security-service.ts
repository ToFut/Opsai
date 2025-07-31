import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Logger } from '@opsai/shared'

export interface SecurityConfig {
  jwtSecret: string
  jwtExpiresIn: string
  bcryptRounds: number
  maxLoginAttempts: number
  lockoutDuration: number
}

export class SecurityService {
  private config: SecurityConfig
  private logger: Logger
  private loginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map()

  constructor(config: SecurityConfig) {
    this.config = config
    this.logger = new Logger('SecurityService')
  }

  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = this.config.bcryptRounds || 12
      const hashedPassword = await bcrypt.hash(password, saltRounds)
      this.logger.debug('Password hashed successfully')
      return hashedPassword
    } catch (error) {
      this.logger.error('Failed to hash password', error)
      throw new Error('Password hashing failed')
    }
  }

  /**
   * Verify a password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hash)
      this.logger.debug(`Password verification: ${isValid ? 'success' : 'failed'}`)
      return isValid
    } catch (error) {
      this.logger.error('Failed to verify password', error)
      return false
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: any): string {
    try {
      const token = jwt.sign(payload, this.config.jwtSecret, {
        expiresIn: this.config.jwtExpiresIn || '24h'
      })
      this.logger.debug('JWT token generated')
      return token
    } catch (error) {
      this.logger.error('Failed to generate JWT token', error)
      throw new Error('Token generation failed')
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret)
      this.logger.debug('JWT token verified')
      return decoded
    } catch (error) {
      this.logger.error('Failed to verify JWT token', error)
      throw new Error('Token verification failed')
    }
  }

  /**
   * Check if user is locked out
   */
  isLockedOut(identifier: string): boolean {
    const attempts = this.loginAttempts.get(identifier)
    if (!attempts) return false

    const lockoutDuration = this.config.lockoutDuration || 15 * 60 * 1000 // 15 minutes
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime()

    if (attempts.count >= (this.config.maxLoginAttempts || 5) && timeSinceLastAttempt < lockoutDuration) {
      return true
    }

    // Reset if lockout period has passed
    if (timeSinceLastAttempt >= lockoutDuration) {
      this.loginAttempts.delete(identifier)
    }

    return false
  }

  /**
   * Record login attempt
   */
  recordLoginAttempt(identifier: string, success: boolean): void {
    if (success) {
      this.loginAttempts.delete(identifier)
      this.logger.debug(`Login successful for: ${identifier}`)
      return
    }

    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: new Date() }
    attempts.count++
    attempts.lastAttempt = new Date()
    this.loginAttempts.set(identifier, attempts)

    this.logger.warn(`Failed login attempt for: ${identifier} (${attempts.count}/${this.config.maxLoginAttempts || 5})`)
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate secure random string
   */
  generateSecureString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): any {
    return {
      activeLockouts: Array.from(this.loginAttempts.entries())
        .filter(([_, attempts]) => this.isLockedOut(_))
        .length,
      totalLoginAttempts: Array.from(this.loginAttempts.values())
        .reduce((sum, attempts) => sum + attempts.count, 0)
    }
  }
} 