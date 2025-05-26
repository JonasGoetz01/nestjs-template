export enum FileCategory {
    DOCUMENT = 'document',
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    ARCHIVE = 'archive',
    OTHER = 'other',
}

export interface FileMetadata {
    id: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    category: FileCategory;
    description?: string;
    tags?: string[];
    folder?: string;
    bucketName: string;
    path: string;
    publicUrl?: string;
    uploadedBy?: string;
    uploadedAt: Date;
    updatedAt: Date;
}

export interface UploadFileOptions {
    filename: string;
    buffer: Buffer;
    mimeType: string;
    size: number;
    category?: FileCategory;
    description?: string;
    tags?: string[];
    folder?: string;
    uploadedBy?: string;
}

export interface FileQueryOptions {
    category?: FileCategory;
    folder?: string;
    search?: string;
    uploadedBy?: string;
    page?: number;
    limit?: number;
}

export interface FileUploadResult {
    success: boolean;
    file?: FileMetadata;
    error?: string;
}

export interface FileListResult {
    files: FileMetadata[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface FileDeleteResult {
    success: boolean;
    error?: string;
}

export interface StorageConfig {
    bucketName: string;
    maxFileSize: number;
    allowedMimeTypes?: string[];
    publicAccess?: boolean;
} 