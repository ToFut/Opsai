import { Queue, Worker, Job } from 'bullmq';
import { createClient } from 'redis';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { prisma } from '@opsai/database';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as mime from 'mime-types';
import { fileTypeFromBuffer } from 'file-type';
import { 
  FileMetadata, 
  UploadRequest, 
  UploadResponse, 
  FileDownloadRequest,
  FileDownloadResponse,
  FileSearchQuery,
  FileSearchResult,
  StorageQuota,
  StorageConfig,
  ProcessingJob
} from '../types';
import { FileProcessor } from '../processors/file-processor';
import { FileError } from '../errors';

export class FileService {
  private s3Client?: S3Client;
  private supabaseClient?: SupabaseClient;
  private fileProcessor: FileProcessor;
  private processingQueue: Queue;
  private processingWorker: Worker;
  private redisClient: any;
  private storageConfig: StorageConfig;

  constructor(storageConfig: StorageConfig) {
    this.storageConfig = storageConfig;
    this.fileProcessor = new FileProcessor();
    
    // Initialize S3 if configured
    if (storageConfig.s3) {
      const s3Config: any = {
        region: storageConfig.s3.region,
        credentials: {
          accessKeyId: storageConfig.s3.accessKeyId,
          secretAccessKey: storageConfig.s3.secretAccessKey
        }
      };
      
      if (storageConfig.s3.endpoint) {
        s3Config.endpoint = storageConfig.s3.endpoint;
      }
      
      if (storageConfig.s3.forcePathStyle !== undefined) {
        s3Config.forcePathStyle = storageConfig.s3.forcePathStyle;
      }
      
      this.s3Client = new S3Client(s3Config);
    }

    // Initialize Supabase if configured
    if (storageConfig.supabase) {
      this.supabaseClient = createSupabaseClient(
        storageConfig.supabase.url,
        storageConfig.supabase.anonKey
      );
    }

    // Initialize Redis and queues
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.processingQueue = new Queue('file-processing', {
      connection: this.redisClient
    });

    this.processingWorker = new Worker(
      'file-processing',
      this.processFileJob.bind(this),
      {
        connection: this.redisClient,
        concurrency: 5
      }
    );
  }

  /**
   * Request file upload
   */
  async requestUpload(request: UploadRequest): Promise<UploadResponse> {
    try {
      // Validate upload request
      await this.validateUploadRequest(request);

      // Check storage quota
      await this.checkStorageQuota(request.tenantId, request.size);

      // Generate file ID and metadata
      const fileId = this.generateFileId();
      const category = this.determineFileCategory(request.mimeType);
      
      const fileMetadata: Omit<FileMetadata, 'createdAt' | 'updatedAt'> = {
        id: fileId,
        filename: this.sanitizeFilename(request.filename),
        originalName: request.filename,
        mimeType: request.mimeType,
        size: request.size,
        path: '',
        storageProvider: this.storageConfig.default,
        category,
        tags: request.tags || [],
        status: 'uploading',
        visibility: request.visibility || 'private',
        accessLevel: 'write',
        tenantId: request.tenantId,
        userId: request.userId,
        folderPath: request.folderPath
      };

      // Generate storage path
      const storagePath = this.generateStoragePath(fileMetadata);
      fileMetadata.path = storagePath;

      // Create file record in database
      await this.createFileRecord(fileMetadata);

      // Generate upload response based on storage provider
      if (this.storageConfig.default === 's3' && this.s3Client) {
        return await this.generateS3UploadResponse(fileMetadata, request);
      } else {
        return await this.generateLocalUploadResponse(fileMetadata, request);
      }
    } catch (error) {
      console.error('Error requesting file upload:', error);
      throw new FileError('Failed to request file upload', error);
    }
  }

  /**
   * Complete file upload (called after successful upload)
   */
  async completeUpload(
    fileId: string, 
    tenantId: string, 
    actualSize?: number,
    checksum?: string
  ): Promise<FileMetadata> {
    try {
      // Update file status
      const updatedFile = await prisma.file.update({
        where: { id: fileId, tenantId },
        data: {
          status: 'processing',
          ...(actualSize && { size: actualSize }),
          ...(checksum && { checksum }),
          updatedAt: new Date()
        }
      });

      const fileMetadata = this.mapDatabaseFileToMetadata(updatedFile);

      // Queue processing jobs
      await this.queueProcessingJobs(fileMetadata);

      console.log(`[File Service] Upload completed for file ${fileId}`);
      return fileMetadata;
    } catch (error) {
      console.error(`Error completing upload for file ${fileId}:`, error);
      throw new FileError('Failed to complete file upload', error);
    }
  }

  /**
   * Download file
   */
  async downloadFile(request: FileDownloadRequest): Promise<FileDownloadResponse> {
    try {
      // Get file metadata
      const file = await this.getFileMetadata(request.fileId, request.tenantId);
      if (!file) {
        throw new FileError('File not found');
      }

      // Check permissions
      await this.checkDownloadPermissions(file, request.userId);

      // Update last accessed time
      await this.updateLastAccessTime(file.id);

      // Generate download response based on storage provider
      if (file.storageProvider === 's3' && this.s3Client) {
        return await this.generateS3DownloadResponse(file, request);
      } else {
        return await this.generateLocalDownloadResponse(file, request);
      }
    } catch (error) {
      console.error(`Error downloading file ${request.fileId}:`, error);
      throw new FileError('Failed to download file', error);
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string, tenantId: string): Promise<FileMetadata | null> {
    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId, tenantId },
        include: {
          processingJobs: true
        }
      });

      return file ? this.mapDatabaseFileToMetadata(file) : null;
    } catch (error) {
      console.error(`Error getting file metadata ${fileId}:`, error);
      throw new FileError('Failed to get file metadata', error);
    }
  }

  /**
   * Search files
   */
  async searchFiles(query: FileSearchQuery): Promise<FileSearchResult> {
    try {
      const startTime = Date.now();

      // Build where clause
      const where: any = {
        tenantId: query.tenantId,
        status: { not: 'deleted' }
      };

      if (query.userId) where.userId = query.userId;
      if (query.filename) {
        where.OR = [
          { filename: { contains: query.filename, mode: 'insensitive' } },
          { originalName: { contains: query.filename, mode: 'insensitive' } }
        ];
      }
      if (query.mimeTypes?.length) where.mimeType = { in: query.mimeTypes };
      if (query.categories?.length) where.category = { in: query.categories };
      if (query.tags?.length) {
        where.tags = { hasSome: query.tags };
      }
      if (query.folderPath) where.folderPath = { startsWith: query.folderPath };
      if (query.status?.length) where.status = { in: query.status };
      if (query.visibility?.length) where.visibility = { in: query.visibility };

      // Date filters
      if (query.createdAfter || query.createdBefore) {
        where.createdAt = {};
        if (query.createdAfter) where.createdAt.gte = query.createdAfter;
        if (query.createdBefore) where.createdAt.lte = query.createdBefore;
      }

      // Size filters
      if (query.minSize || query.maxSize) {
        where.size = {};
        if (query.minSize) where.size.gte = query.minSize;
        if (query.maxSize) where.size.lte = query.maxSize;
      }

      // Text search
      if (query.textContent) {
        where.extractedText = { contains: query.textContent, mode: 'insensitive' };
      }

      // Execute search with pagination
      const [files, total] = await Promise.all([
        prisma.file.findMany({
          where,
          include: { processingJobs: true },
          orderBy: this.buildOrderByClause(query.sortBy, query.sortOrder),
          take: query.limit || 20,
          skip: query.offset || 0
        }),
        prisma.file.count({ where })
      ]);

      const searchTime = Date.now() - startTime;

      // Generate aggregations
      const aggregations = await this.generateSearchAggregations(where);

      return {
        files: files.map(f => this.mapDatabaseFileToMetadata(f)),
        total,
        hasMore: (query.offset || 0) + files.length < total,
        searchTime,
        aggregations
      };
    } catch (error) {
      console.error('Error searching files:', error);
      throw new FileError('Failed to search files', error);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string, tenantId: string, userId: string): Promise<void> {
    try {
      const file = await this.getFileMetadata(fileId, tenantId);
      if (!file) {
        throw new FileError('File not found');
      }

      // Check permissions
      if (file.userId !== userId) {
        // TODO: Check if user has admin permissions
        throw new FileError('Insufficient permissions to delete file');
      }

      // Soft delete - mark as deleted
      await prisma.file.update({
        where: { id: fileId, tenantId },
        data: {
          status: 'deleted',
          updatedAt: new Date()
        }
      });

      // Queue physical deletion job
      await this.processingQueue.add(
        'delete-file',
        { fileId, tenantId, filePath: file.path, storageProvider: file.storageProvider },
        { delay: 24 * 60 * 60 * 1000 } // Delete after 24 hours
      );

      console.log(`[File Service] File ${fileId} marked for deletion`);
    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error);
      throw new FileError('Failed to delete file', error);
    }
  }

  /**
   * Get storage quota information
   */
  async getStorageQuota(tenantId: string): Promise<StorageQuota> {
    try {
      // Get current usage
      const stats = await prisma.file.aggregate({
        where: { 
          tenantId, 
          status: { not: 'deleted' } 
        },
        _sum: { size: true },
        _count: true
      });

      // Get usage by category
      const categoryStats = await prisma.file.groupBy({
        by: ['category'],
        where: { 
          tenantId, 
          status: { not: 'deleted' } 
        },
        _sum: { size: true }
      });

      const usage = {
        documents: 0,
        images: 0,
        videos: 0,
        audio: 0,
        archives: 0,
        data: 0,
        other: 0
      };

      categoryStats.forEach(stat => {
        if (stat.category in usage) {
          (usage as any)[stat.category] = stat._sum.size || 0;
        }
      });

      // Get tenant limits (would come from subscription/plan)
      const maxBytes = 10 * 1024 * 1024 * 1024; // 10GB default
      const maxFiles = 100000; // 100k files default
      const maxFileSize = 100 * 1024 * 1024; // 100MB default

      const usedBytes = stats._sum.size || 0;
      const fileCount = stats._count || 0;

      // Check for expired files
      const expiredCount = await prisma.file.count({
        where: {
          tenantId,
          expiresAt: { lt: new Date() },
          status: { not: 'deleted' }
        }
      });

      return {
        tenantId,
        usedBytes,
        fileCount,
        maxBytes,
        maxFiles,
        maxFileSize,
        usage,
        warnings: {
          nearQuotaLimit: usedBytes > maxBytes * 0.8,
          nearFileLimit: fileCount > maxFiles * 0.8,
          hasExpiredFiles: expiredCount > 0
        }
      };
    } catch (error) {
      console.error(`Error getting storage quota for tenant ${tenantId}:`, error);
      throw new FileError('Failed to get storage quota', error);
    }
  }

  /**
   * Generate file processing jobs
   */
  private async queueProcessingJobs(file: FileMetadata): Promise<void> {
    const jobs: Array<{ type: string; config: any }> = [];

    // Generate thumbnails for images
    if (file.category === 'image') {
      jobs.push({
        type: 'thumbnail',
        config: {
          thumbnailSizes: [
            { width: 150, height: 150 },
            { width: 300, height: 300 },
            { width: 800, height: 600 }
          ]
        }
      });
    }

    // Extract text from documents
    if (['document', 'data'].includes(file.category)) {
      jobs.push({
        type: 'extraction',
        config: {
          extractText: true,
          extractMetadata: true
        }
      });
    }

    // Queue jobs
    for (const job of jobs) {
      await this.processingQueue.add(
        'process-file',
        {
          fileId: file.id,
          tenantId: file.tenantId,
          jobType: job.type,
          jobConfig: job.config
        },
        {
          removeOnComplete: 10,
          removeOnFail: 5
        }
      );
    }
  }

  /**
   * Process file job (called by BullMQ worker)
   */
  private async processFileJob(job: Job): Promise<void> {
    const { fileId, tenantId, jobType, jobConfig } = job.data;

    try {
      console.log(`[File Service] Processing ${jobType} job for file ${fileId}`);

      const file = await this.getFileMetadata(fileId, tenantId);
      if (!file) {
        throw new Error('File not found');
      }

      let result;
      switch (jobType) {
        case 'thumbnail':
          result = await this.fileProcessor.generateThumbnails(file, jobConfig);
          break;
        case 'extraction':
          result = await this.fileProcessor.extractContent(file, jobConfig);
          break;
        case 'conversion':
          result = await this.fileProcessor.convertFormat(file, jobConfig);
          break;
        case 'delete-file':
          result = await this.physicallyDeleteFile(job.data);
          break;
        default:
          throw new Error(`Unsupported job type: ${jobType}`);
      }

      // Update file with processing results
      if (jobType !== 'delete-file') {
        await this.updateFileWithProcessingResults(fileId, jobType, result);
      }

      console.log(`[File Service] Completed ${jobType} job for file ${fileId}`);
    } catch (error) {
      console.error(`[File Service] Processing job failed for file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Physically delete file from storage
   */
  private async physicallyDeleteFile(jobData: any): Promise<void> {
    const { fileId, tenantId, filePath, storageProvider } = jobData;

    try {
      if (storageProvider === 's3' && this.s3Client) {
        // Delete from S3
        await this.s3Client.send(new DeleteObjectCommand({
          Bucket: this.storageConfig.s3!.bucket,
          Key: filePath
        }));
      } else if (this.supabaseClient) {
        // Delete from Supabase Storage
        const { data, error } = await this.supabaseClient
          .storage
          .from(this.storageConfig.supabase!.bucket)
          .remove([filePath]);

        if (error) {
          throw new FileError(`Failed to delete from Supabase Storage: ${error.message}`);
        }
      } else {
        // Delete from local storage
        const fullPath = path.join(this.storageConfig.local!.basePath, filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      // Remove from database
      await prisma.file.delete({
        where: { id: fileId, tenantId }
      });

      console.log(`[File Service] Physically deleted file ${fileId}`);
    } catch (error) {
      console.error(`Error physically deleting file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Utility methods
   */
  private generateFileId(): string {
    return `file-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 255);
  }

  private determineFileCategory(mimeType: string): FileMetadata['category'] {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive';
    if (mimeType.includes('json') || mimeType.includes('csv') || mimeType.includes('xml')) return 'data';
    return 'other';
  }

  private generateStoragePath(file: Omit<FileMetadata, 'createdAt' | 'updatedAt'>): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${file.tenantId}/${year}/${month}/${day}/${file.id}/${file.filename}`;
  }

  private async validateUploadRequest(request: UploadRequest): Promise<void> {
    // Size validation
    if (request.size > 100 * 1024 * 1024) { // 100MB
      throw new FileError('File size exceeds maximum limit');
    }

    // MIME type validation
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv',
      'application/json', 'application/xml',
      'video/mp4', 'audio/mpeg',
      'application/zip', 'application/x-zip-compressed'
    ];

    if (!allowedTypes.includes(request.mimeType)) {
      throw new FileError(`File type ${request.mimeType} is not allowed`);
    }
  }

  private async checkStorageQuota(tenantId: string, fileSize: number): Promise<void> {
    const quota = await this.getStorageQuota(tenantId);
    
    if (quota.usedBytes + fileSize > quota.maxBytes) {
      throw new FileError('Storage quota exceeded');
    }

    if (quota.fileCount >= quota.maxFiles) {
      throw new FileError('File count limit exceeded');
    }
  }

  private async generateS3UploadResponse(
    file: Omit<FileMetadata, 'createdAt' | 'updatedAt'>, 
    request: UploadRequest
  ): Promise<UploadResponse> {
    if (!this.s3Client || !this.storageConfig.s3) {
      throw new FileError('S3 not configured');
    }

    const command = new PutObjectCommand({
      Bucket: this.storageConfig.s3.bucket,
      Key: file.path,
      ContentType: file.mimeType,
      ContentLength: file.size,
      Metadata: {
        'tenant-id': file.tenantId,
        'user-id': file.userId,
        'original-name': file.originalName
      }
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    return {
      fileId: file.id,
      uploadUrl,
      uploadMethod: 'presigned',
      maxFileSize: file.size,
      expiresAt: new Date(Date.now() + 3600 * 1000)
    };
  }

  private async generateLocalUploadResponse(
    file: Omit<FileMetadata, 'createdAt' | 'updatedAt'>, 
    request: UploadRequest
  ): Promise<UploadResponse> {
    // For local storage, file would be uploaded directly to API endpoint
    return {
      fileId: file.id,
      uploadMethod: 'direct',
      maxFileSize: file.size,
      expiresAt: new Date(Date.now() + 3600 * 1000)
    };
  }

  private async generateS3DownloadResponse(
    file: FileMetadata, 
    request: FileDownloadRequest
  ): Promise<FileDownloadResponse> {
    if (!this.s3Client || !this.storageConfig.s3) {
      throw new FileError('S3 not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.storageConfig.s3.bucket,
      Key: file.path,
      ...(request.asAttachment && {
        ResponseContentDisposition: `attachment; filename=\"${request.filename || file.filename}\"`
      })
    });

    const downloadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    return {
      downloadUrl,
      filename: request.filename || file.filename,
      mimeType: file.mimeType,
      size: file.size,
      expiresAt: new Date(Date.now() + 3600 * 1000)
    };
  }

  private async generateLocalDownloadResponse(
    file: FileMetadata, 
    request: FileDownloadRequest
  ): Promise<FileDownloadResponse> {
    const fullPath = path.join(this.storageConfig.local!.basePath, file.path);
    
    if (!fs.existsSync(fullPath)) {
      throw new FileError('File not found in storage');
    }

    // For local storage, return file path that can be served by web server
    return {
      downloadUrl: `/files/download/${file.id}`,
      filename: request.filename || file.filename,
      mimeType: file.mimeType,
      size: file.size,
      expiresAt: new Date(Date.now() + 3600 * 1000)
    };
  }

  private async createFileRecord(file: Omit<FileMetadata, 'createdAt' | 'updatedAt'>): Promise<void> {
    await prisma.file.create({
      data: {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        path: file.path,
        storageProvider: file.storageProvider,
        bucket: file.bucket,
        key: file.key,
        category: file.category,
        tags: file.tags || [],
        status: file.status,
        visibility: file.visibility,
        accessLevel: file.accessLevel,
        encryptionKey: file.encryptionKey,
        tenantId: file.tenantId,
        userId: file.userId,
        parentId: file.parentId,
        folderPath: file.folderPath,
        expiresAt: file.expiresAt
      }
    });
  }

  private mapDatabaseFileToMetadata(dbFile: any): FileMetadata {
    return {
      id: dbFile.id,
      filename: dbFile.filename,
      originalName: dbFile.originalName,
      mimeType: dbFile.mimeType,
      size: dbFile.size,
      path: dbFile.path,
      url: dbFile.url,
      storageProvider: dbFile.storageProvider,
      bucket: dbFile.bucket,
      key: dbFile.key,
      category: dbFile.category,
      tags: dbFile.tags || [],
      status: dbFile.status,
      processingJobs: dbFile.processingJobs?.map((job: any) => ({
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        config: JSON.parse(job.config || '{}'),
        output: job.output ? JSON.parse(job.output) : undefined,
        createdAt: job.createdAt,
        completedAt: job.completedAt
      })) || [],
      visibility: dbFile.visibility,
      accessLevel: dbFile.accessLevel,
      encryptionKey: dbFile.encryptionKey,
      extractedMetadata: dbFile.extractedMetadata ? JSON.parse(dbFile.extractedMetadata) : undefined,
      tenantId: dbFile.tenantId,
      userId: dbFile.userId,
      parentId: dbFile.parentId,
      folderPath: dbFile.folderPath,
      createdAt: dbFile.createdAt,
      updatedAt: dbFile.updatedAt,
      expiresAt: dbFile.expiresAt,
      lastAccessedAt: dbFile.lastAccessedAt
    };
  }

  private buildOrderByClause(sortBy?: string, sortOrder?: string): any {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'name':
        return { filename: order };
      case 'size':
        return { size: order };
      case 'created':
        return { createdAt: order };
      case 'modified':
        return { updatedAt: order };
      default:
        return { createdAt: 'desc' };
    }
  }

  private async generateSearchAggregations(where: any): Promise<any> {
    // This would generate aggregations for search facets
    // For now, return empty aggregations
    return {
      categories: {},
      mimeTypes: {},
      tags: {},
      sizes: { small: 0, medium: 0, large: 0 }
    };
  }

  private async checkDownloadPermissions(file: FileMetadata, userId: string): Promise<void> {
    // Check if user has permission to download file
    if (file.visibility === 'private' && file.userId !== userId) {
      // TODO: Check if user has admin permissions or file is shared
      throw new FileError('Insufficient permissions to download file');
    }
  }

  private async updateLastAccessTime(fileId: string): Promise<void> {
    await prisma.file.update({
      where: { id: fileId },
      data: { lastAccessedAt: new Date() }
    });
  }

  private async updateFileWithProcessingResults(
    fileId: string, 
    jobType: string, 
    result: any
  ): Promise<void> {
    const updates: any = {};

    if (jobType === 'extraction' && result.extractedText) {
      updates.extractedText = result.extractedText;
    }

    if (result.metadata) {
      updates.extractedMetadata = JSON.stringify(result.metadata);
    }

    if (Object.keys(updates).length > 0) {
      updates.status = 'ready';
      updates.updatedAt = new Date();

      await prisma.file.update({
        where: { id: fileId },
        data: updates
      });
    }
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    await this.processingWorker.close();
    await this.processingQueue.close();
    await this.redisClient.quit();
  }
}

