export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  
  // Storage information
  storageProvider: 'local' | 's3' | 'supabase' | 'gcp' | 'azure';
  bucket?: string;
  key?: string;
  
  // File categorization
  category: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'data' | 'other';
  tags?: string[];
  
  // Processing status
  status: 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted';
  processingJobs?: ProcessingJob[];
  
  // Security and access
  visibility: 'public' | 'private' | 'tenant';
  accessLevel: 'read' | 'write' | 'admin';
  encryptionKey?: string;
  
  // Metadata extracted from file
  extractedMetadata?: {
    dimensions?: { width: number; height: number };
    duration?: number; // for audio/video
    pageCount?: number; // for documents
    textContent?: string;
    exifData?: any;
    customFields?: Record<string, any>;
  };
  
  // Relationships
  tenantId: string;
  userId: string;
  parentId?: string; // For file versions or related files
  folderPath?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  lastAccessedAt?: Date;
}

export interface ProcessingJob {
  id: string;
  type: 'thumbnail' | 'conversion' | 'extraction' | 'compression' | 'watermark' | 'custom';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  
  // Job configuration
  config: {
    // Thumbnail generation
    thumbnailSizes?: Array<{ width: number; height: number; quality?: number }>;
    
    // Format conversion
    targetFormat?: string;
    quality?: number;
    
    // Text extraction
    extractText?: boolean;
    extractMetadata?: boolean;
    
    // Compression
    compressionLevel?: number;
    
    // Watermark
    watermark?: {
      text?: string;
      image?: string;
      position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
      opacity?: number;
    };
    
    // Custom processing
    customScript?: string;
    customParams?: Record<string, any>;
  };
  
  // Results
  output?: {
    files?: FileMetadata[];
    extractedData?: any;
    thumbnails?: Array<{ size: string; url: string }>;
    error?: string;
  };
  
  createdAt: Date;
  completedAt?: Date;
}

export interface UploadRequest {
  filename: string;
  mimeType: string;
  size: number;
  
  // Upload configuration
  category?: string;
  tags?: string[];
  visibility?: 'public' | 'private' | 'tenant';
  folderPath?: string;
  
  // Processing requests
  generateThumbnails?: boolean;
  extractText?: boolean;
  extractMetadata?: boolean;
  customProcessing?: ProcessingJob['config'];
  
  // Security
  encryptFile?: boolean;
  expiresIn?: number; // Seconds
  
  // Metadata
  tenantId: string;
  userId: string;
}

export interface UploadResponse {
  fileId: string;
  uploadUrl?: string; // For direct upload (S3 presigned URL)
  uploadFields?: Record<string, string>; // Additional fields for form upload
  
  // For direct upload via API
  file?: FileMetadata;
  
  // Instructions
  uploadMethod: 'direct' | 'presigned' | 'multipart';
  maxFileSize: number;
  expiresAt: Date;
}

export interface FileDownloadRequest {
  fileId: string;
  tenantId: string;
  userId: string;
  
  // Download options
  asAttachment?: boolean;
  filename?: string; // Override original filename
  
  // Processing options
  resize?: { width?: number; height?: number; quality?: number };
  format?: string; // Convert format on-the-fly
  watermark?: boolean;
}

export interface FileDownloadResponse {
  downloadUrl: string;
  filename: string;
  mimeType: string;
  size: number;
  expiresAt: Date;
  
  // For streaming downloads
  stream?: NodeJS.ReadableStream;
}

export interface FileSearchQuery {
  tenantId: string;
  userId?: string;
  
  // Search criteria
  filename?: string;
  mimeTypes?: string[];
  categories?: string[];
  tags?: string[];
  folderPath?: string;
  
  // Date filters
  createdAfter?: Date;
  createdBefore?: Date;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  
  // Size filters
  minSize?: number;
  maxSize?: number;
  
  // Status filters
  status?: string[];
  visibility?: string[];
  
  // Full-text search
  textContent?: string;
  
  // Sorting and pagination
  sortBy?: 'name' | 'size' | 'created' | 'modified' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface FileSearchResult {
  files: FileMetadata[];
  total: number;
  hasMore: boolean;
  
  // Search metadata
  searchTime: number; // milliseconds
  aggregations?: {
    categories: Record<string, number>;
    mimeTypes: Record<string, number>;
    tags: Record<string, number>;
    sizes: {
      small: number; // < 1MB
      medium: number; // 1MB - 10MB
      large: number; // > 10MB
    };
  };
}

export interface StorageQuota {
  tenantId: string;
  
  // Current usage
  usedBytes: number;
  fileCount: number;
  
  // Limits
  maxBytes: number;
  maxFiles: number;
  maxFileSize: number;
  
  // Breakdown by category
  usage: {
    documents: number;
    images: number;
    videos: number;
    audio: number;
    archives: number;
    data: number;
    other: number;
  };
  
  // Warnings
  warnings: {
    nearQuotaLimit: boolean; // > 80% usage
    nearFileLimit: boolean;
    hasExpiredFiles: boolean;
  };
}

export interface FileShare {
  id: string;
  fileId: string;
  tenantId: string;
  createdBy: string;
  
  // Share configuration
  shareType: 'public' | 'protected' | 'private';
  shareToken: string;
  password?: string;
  
  // Access control
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canComment: boolean;
    canShare: boolean;
  };
  
  // Expiration
  expiresAt?: Date;
  maxDownloads?: number;
  downloadCount: number;
  
  // Tracking
  accessLog?: Array<{
    timestamp: Date;
    ip: string;
    userAgent: string;
    action: 'view' | 'download';
  }>;
  
  createdAt: Date;
  lastAccessedAt?: Date;
}

export interface FileVersion {
  id: string;
  fileId: string; // Original file ID
  versionNumber: number;
  
  // Version metadata
  filename: string;
  size: number;
  mimeType: string;
  checksum: string;
  
  // Change information
  changeNote?: string;
  changedBy: string;
  changeType: 'upload' | 'edit' | 'process' | 'restore';
  
  // Storage
  path: string;
  storageProvider: string;
  
  createdAt: Date;
}

export interface FileActivity {
  id: string;
  fileId: string;
  tenantId: string;
  userId: string;
  
  // Activity details
  action: 'upload' | 'download' | 'view' | 'edit' | 'delete' | 'share' | 'process';
  details?: Record<string, any>;
  
  // Context
  ip?: string;
  userAgent?: string;
  source?: string; // API, web, mobile, etc.
  
  timestamp: Date;
}

// Storage provider configurations
export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // For S3-compatible services
  forcePathStyle?: boolean;
}

export interface SupabaseStorageConfig {
  url: string;
  anonKey: string;
  bucket: string;
  serviceRoleKey?: string; // For admin operations
}

export interface LocalStorageConfig {
  basePath: string;
  maxFileSize: number;
  allowedMimeTypes?: string[];
}

export interface StorageConfig {
  default: 'local' | 's3' | 'supabase' | 'gcp' | 'azure';
  
  local?: LocalStorageConfig;
  s3?: S3Config;
  supabase?: SupabaseStorageConfig;
  // Add other providers as needed
}

// File processing configurations
export interface ThumbnailConfig {
  sizes: Array<{
    name: string;
    width: number;
    height: number;
    quality?: number;
  }>;
  format: 'jpeg' | 'png' | 'webp';
  background?: string; // For transparent images
}

export interface TextExtractionConfig {
  maxTextLength?: number;
  includeMetadata?: boolean;
  ocrEnabled?: boolean; // For images
  ocrLanguages?: string[];
}

export interface FileValidationRule {
  name: string;
  enabled: boolean;
  
  // File type restrictions
  allowedMimeTypes?: string[];
  blockedMimeTypes?: string[];
  allowedExtensions?: string[];
  blockedExtensions?: string[];
  
  // Size restrictions
  maxFileSize?: number;
  minFileSize?: number;
  
  // Content validation
  scanForViruses?: boolean;
  scanForMalware?: boolean;
  
  // Custom validation
  customValidation?: {
    script: string;
    timeout: number;
  };
}

// Storage provider interface
export interface StorageProvider {
  upload(filePath: string, buffer: Buffer, mimeType?: string): Promise<void>;
  download(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  getSize(filePath: string): Promise<number>;
}