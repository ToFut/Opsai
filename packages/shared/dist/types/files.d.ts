export interface File {
    id: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    url: string;
    metadata: FileMetadata;
    tenantId: string;
    uploadedBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface FileMetadata {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
    encoding?: string;
    checksum: string;
    virusScanStatus: 'pending' | 'clean' | 'infected';
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}
export interface FileUpload {
    file: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
    metadata?: Partial<FileMetadata>;
}
export interface FileProcessingResult {
    success: boolean;
    processedFile?: File;
    thumbnails?: File[];
    extractedText?: string;
    metadata?: Record<string, any>;
    errors?: string[];
}
export interface StorageConfig {
    provider: 'supabase' | 'aws-s3' | 'local';
    bucket?: string;
    region?: string;
    accessKey?: string;
    secretKey?: string;
    endpoint?: string;
}
export interface ThumbnailConfig {
    width: number;
    height: number;
    quality: number;
    format: 'jpeg' | 'png' | 'webp';
}
export interface OCRResult {
    text: string;
    confidence: number;
    boundingBoxes: BoundingBox[];
    language: string;
}
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    confidence: number;
}
export interface VideoProcessingResult {
    duration: number;
    resolution: {
        width: number;
        height: number;
    };
    format: string;
    codec: string;
    thumbnail?: File;
    segments?: VideoSegment[];
}
export interface VideoSegment {
    startTime: number;
    endTime: number;
    label?: string;
    confidence?: number;
}
export interface DocumentProcessingResult {
    pages: number;
    text: string;
    metadata: Record<string, any>;
    structure?: DocumentStructure;
}
export interface DocumentStructure {
    sections: DocumentSection[];
    tables: DocumentTable[];
    images: DocumentImage[];
}
export interface DocumentSection {
    title: string;
    content: string;
    level: number;
    page: number;
}
export interface DocumentTable {
    data: string[][];
    headers: string[];
    page: number;
}
export interface DocumentImage {
    description?: string;
    page: number;
    boundingBox: BoundingBox;
}
//# sourceMappingURL=files.d.ts.map