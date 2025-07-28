// Core file service
export { FileService } from './services/file-service';

// File processor
export { FileProcessor } from './processors/file-processor';

// Types
export {
  FileMetadata,
  ProcessingJob,
  UploadRequest,
  UploadResponse,
  FileDownloadRequest,
  FileDownloadResponse,
  FileSearchQuery,
  FileSearchResult,
  StorageQuota,
  FileShare,
  FileVersion,
  FileActivity,
  S3Config,
  LocalStorageConfig,
  StorageConfig,
  ThumbnailConfig,
  TextExtractionConfig,
  FileValidationRule
} from './types';

// Errors
export { FileError } from './errors';

// Re-export for convenience
export type {
  FileMetadata as File,
  UploadRequest as FileUploadRequest,
  FileDownloadRequest as DownloadRequest,
  FileSearchQuery as SearchQuery
} from './types';