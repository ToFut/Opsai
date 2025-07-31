import * as fs from 'fs/promises'
import * as path from 'path'
import { Logger } from './logger'

export class FileUtils {
  private logger: Logger

  constructor() {
    this.logger = new Logger('FileUtils')
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath)
    } catch {
      await fs.mkdir(dirPath, { recursive: true })
      this.logger.info(`Created directory: ${dirPath}`)
    }
  }

  /**
   * Copy directory recursively
   */
  async copyDir(src: string, dest: string): Promise<void> {
    try {
      await this.ensureDir(dest)
      const entries = await fs.readdir(src, { withFileTypes: true })

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)

        if (entry.isDirectory()) {
          await this.copyDir(srcPath, destPath)
        } else {
          await fs.copyFile(srcPath, destPath)
        }
      }
      
      this.logger.info(`Copied directory: ${src} -> ${dest}`)
    } catch (error) {
      this.logger.error(`Failed to copy directory: ${src} -> ${dest}`, error)
      throw error
    }
  }

  /**
   * Write file with content
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const dir = path.dirname(filePath)
      await this.ensureDir(dir)
      await fs.writeFile(filePath, content, 'utf8')
      this.logger.info(`Written file: ${filePath}`)
    } catch (error) {
      this.logger.error(`Failed to write file: ${filePath}`, error)
      throw error
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      this.logger.info(`Read file: ${filePath}`)
      return content
    } catch (error) {
      this.logger.error(`Failed to read file: ${filePath}`, error)
      throw error
    }
  }

  /**
   * Check if file exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Delete file or directory
   */
  async remove(filePath: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath)
      if (stats.isDirectory()) {
        await fs.rmdir(filePath, { recursive: true })
      } else {
        await fs.unlink(filePath)
      }
      this.logger.info(`Removed: ${filePath}`)
    } catch (error) {
      this.logger.error(`Failed to remove: ${filePath}`, error)
      throw error
    }
  }

  /**
   * Get all files in directory recursively
   */
  async getAllFiles(dirPath: string, extensions?: string[]): Promise<string[]> {
    const files: string[] = []
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        
        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath, extensions)
          files.push(...subFiles)
        } else if (entry.isFile()) {
          if (!extensions || extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath)
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to get files from: ${dirPath}`, error)
      throw error
    }
    
    return files
  }

  /**
   * Create a backup of a file
   */
  async backupFile(filePath: string): Promise<string> {
    try {
      const backupPath = `${filePath}.backup.${Date.now()}`
      await fs.copyFile(filePath, backupPath)
      this.logger.info(`Created backup: ${backupPath}`)
      return backupPath
    } catch (error) {
      this.logger.error(`Failed to create backup: ${filePath}`, error)
      throw error
    }
  }

  /**
   * Get file size in bytes
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath)
      return stats.size
    } catch (error) {
      this.logger.error(`Failed to get file size: ${filePath}`, error)
      throw error
    }
  }

  /**
   * Get file modification time
   */
  async getFileModifiedTime(filePath: string): Promise<Date> {
    try {
      const stats = await fs.stat(filePath)
      return stats.mtime
    } catch (error) {
      this.logger.error(`Failed to get file modified time: ${filePath}`, error)
      throw error
    }
  }
} 