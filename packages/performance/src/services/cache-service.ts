import NodeCache from 'node-cache'
import { Logger } from '@opsai/shared'

export interface CacheOptions {
  ttl?: number
  checkperiod?: number
  useClones?: boolean
  deleteOnExpire?: boolean
}

export interface CacheEntry<T = any> {
  key: string
  value: T
  ttl?: number
  createdAt: Date
  expiresAt?: Date
}

export class CacheService {
  private cache: NodeCache
  private logger: Logger

  constructor(options: CacheOptions = {}) {
    this.cache = new NodeCache({
      stdTTL: options.ttl || 3600, // 1 hour default
      checkperiod: options.checkperiod || 600, // 10 minutes
      useClones: options.useClones || false,
      deleteOnExpire: options.deleteOnExpire || true
    })
    
    this.logger = new Logger('CacheService')
    
    // Set up event listeners
    this.cache.on('expired', (key, value) => {
      this.logger.debug(`Cache entry expired: ${key}`)
    })
    
    this.cache.on('flush', () => {
      this.logger.info('Cache flushed')
    })
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const success = this.cache.set(key, value, ttl)
      if (success) {
        this.logger.debug(`Cached: ${key}`)
      }
      return success
    } catch (error) {
      this.logger.error(`Failed to cache: ${key}`, error)
      return false
    }
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | undefined {
    try {
      const value = this.cache.get<T>(key)
      if (value !== undefined) {
        this.logger.debug(`Cache hit: ${key}`)
      } else {
        this.logger.debug(`Cache miss: ${key}`)
      }
      return value
    } catch (error) {
      this.logger.error(`Failed to get from cache: ${key}`, error)
      return undefined
    }
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    try {
      const deleted = this.cache.del(key) > 0
      if (deleted) {
        this.logger.debug(`Deleted from cache: ${key}`)
      }
      return deleted
    } catch (error) {
      this.logger.error(`Failed to delete from cache: ${key}`, error)
      return false
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats()
  }

  /**
   * Flush all cache entries
   */
  flush(): void {
    this.cache.flushAll()
    this.logger.info('Cache flushed')
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return this.cache.keys()
  }

  /**
   * Get cache entry with metadata
   */
  getEntry<T>(key: string): CacheEntry<T> | undefined {
    try {
      const value = this.cache.get<T>(key)
      if (value === undefined) return undefined

      const ttl = this.cache.getTtl(key)
      const createdAt = new Date(ttl ? ttl - (this.cache.options.stdTTL || 3600) * 1000 : Date.now())
      
      return {
        key,
        value,
        ttl: this.cache.options.stdTTL,
        createdAt,
        expiresAt: ttl ? new Date(ttl) : undefined
      }
    } catch (error) {
      this.logger.error(`Failed to get cache entry: ${key}`, error)
      return undefined
    }
  }

  /**
   * Set cache entry with metadata
   */
  setEntry<T>(entry: CacheEntry<T>): boolean {
    return this.set(entry.key, entry.value, entry.ttl)
  }

  /**
   * Get multiple values from cache
   */
  mget<T>(keys: string[]): Record<string, T> {
    try {
      const values = this.cache.mget<T>(keys)
      this.logger.debug(`Multi-get: ${keys.length} keys`)
      return values
    } catch (error) {
      this.logger.error('Failed to multi-get from cache', error)
      return {}
    }
  }

  /**
   * Set multiple values in cache
   */
  mset<T>(entries: Record<string, T>, ttl?: number): boolean {
    try {
      const success = this.cache.mset(entries, ttl)
      if (success) {
        this.logger.debug(`Multi-set: ${Object.keys(entries).length} entries`)
      }
      return success
    } catch (error) {
      this.logger.error('Failed to multi-set in cache', error)
      return false
    }
  }
} 