import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { FileEntity } from './entities/file.entity';
import {
    FileMetadata,
    UploadFileOptions,
    FileQueryOptions,
    FileUploadResult,
    FileListResult,
    FileDeleteResult,
    StorageConfig,
    FileCategory,
} from './interfaces/file.interface';

@Injectable()
export class FilesService {
    private readonly logger = new Logger(FilesService.name);
    private readonly supabase: SupabaseClient;
    private readonly defaultBucket: string;
    private readonly maxFileSize: number;

    constructor(
        @InjectRepository(FileEntity)
        private readonly fileRepository: Repository<FileEntity>,
        private readonly configService: ConfigService,
    ) {
        // Initialize Supabase client
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || 'http://kong:8000';
        const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY') ||
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.defaultBucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'files';
        this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE') || 100 * 1024 * 1024; // 100MB
    }

    /**
     * Initialize storage bucket if it doesn't exist
     */
    async initializeBucket(bucketName: string = this.defaultBucket): Promise<void> {
        try {
            const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();

            if (listError) {
                this.logger.error('Error listing buckets:', listError);
                return;
            }

            const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

            if (!bucketExists) {
                const { error: createError } = await this.supabase.storage.createBucket(bucketName, {
                    public: false,
                    allowedMimeTypes: undefined,
                    fileSizeLimit: this.maxFileSize,
                });

                if (createError) {
                    this.logger.error(`Error creating bucket ${bucketName}:`, createError);
                } else {
                    this.logger.log(`Bucket ${bucketName} created successfully`);
                }
            }
        } catch (error) {
            this.logger.error('Error initializing bucket:', error);
        }
    }

    /**
     * Upload a file to Supabase Storage and save metadata
     */
    async uploadFile(options: UploadFileOptions, config?: StorageConfig): Promise<FileUploadResult> {
        try {
            const bucketName = config?.bucketName || this.defaultBucket;
            const maxSize = config?.maxFileSize || this.maxFileSize;

            // Validate file size
            if (options.size > maxSize) {
                return {
                    success: false,
                    error: `File size exceeds maximum allowed size of ${maxSize} bytes`,
                };
            }

            // Validate MIME type if specified
            if (config?.allowedMimeTypes && !config.allowedMimeTypes.includes(options.mimeType)) {
                return {
                    success: false,
                    error: `File type ${options.mimeType} is not allowed`,
                };
            }

            // Generate unique filename
            const fileExtension = path.extname(options.filename);
            const baseName = path.basename(options.filename, fileExtension);
            const uniqueId = uuidv4();
            const uniqueFilename = `${baseName}_${uniqueId}${fileExtension}`;

            // Construct file path
            const filePath = options.folder
                ? `${options.folder}/${uniqueFilename}`
                : uniqueFilename;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from(bucketName)
                .upload(filePath, options.buffer, {
                    contentType: options.mimeType,
                    duplex: 'half',
                });

            if (uploadError) {
                this.logger.error('Error uploading file to Supabase:', uploadError);
                return {
                    success: false,
                    error: `Upload failed: ${uploadError.message}`,
                };
            }

            // Get public URL if bucket is public
            let publicUrl: string | undefined;
            if (config?.publicAccess) {
                const { data: urlData } = this.supabase.storage
                    .from(bucketName)
                    .getPublicUrl(filePath);
                publicUrl = urlData.publicUrl;
            }

            // Determine file category based on MIME type if not provided
            const category = options.category || this.determineCategoryFromMimeType(options.mimeType);

            // Save metadata to database
            const fileEntity = this.fileRepository.create({
                filename: uniqueFilename,
                originalName: options.filename,
                size: options.size,
                mimeType: options.mimeType,
                category,
                description: options.description,
                tags: options.tags,
                folder: options.folder,
                bucketName,
                path: filePath,
                publicUrl,
                uploadedBy: options.uploadedBy,
            });

            const savedFile = await this.fileRepository.save(fileEntity);

            return {
                success: true,
                file: this.entityToMetadata(savedFile),
            };
        } catch (error) {
            this.logger.error('Error in uploadFile:', error);
            return {
                success: false,
                error: `Upload failed: ${error.message}`,
            };
        }
    }

    /**
     * Retrieve a file by ID
     */
    async getFileById(id: string): Promise<FileMetadata | null> {
        try {
            const fileEntity = await this.fileRepository.findOne({ where: { id } });
            return fileEntity ? this.entityToMetadata(fileEntity) : null;
        } catch (error) {
            this.logger.error('Error getting file by ID:', error);
            return null;
        }
    }

    /**
     * Download file content from Supabase Storage
     */
    async downloadFile(id: string): Promise<{ buffer: Buffer; metadata: FileMetadata } | null> {
        try {
            const fileMetadata = await this.getFileById(id);
            if (!fileMetadata) {
                return null;
            }

            const { data, error } = await this.supabase.storage
                .from(fileMetadata.bucketName)
                .download(fileMetadata.path);

            if (error) {
                this.logger.error('Error downloading file from Supabase:', error);
                return null;
            }

            const buffer = Buffer.from(await data.arrayBuffer());
            return { buffer, metadata: fileMetadata };
        } catch (error) {
            this.logger.error('Error in downloadFile:', error);
            return null;
        }
    }

    /**
     * List files with filtering and pagination
     */
    async listFiles(options: FileQueryOptions = {}): Promise<FileListResult> {
        try {
            const {
                category,
                folder,
                search,
                uploadedBy,
                page = 1,
                limit = 10,
            } = options;

            const queryBuilder = this.fileRepository.createQueryBuilder('file');

            // Apply filters
            if (category) {
                queryBuilder.andWhere('file.category = :category', { category });
            }

            if (folder) {
                queryBuilder.andWhere('file.folder = :folder', { folder });
            }

            if (uploadedBy) {
                queryBuilder.andWhere('file.uploadedBy = :uploadedBy', { uploadedBy });
            }

            if (search) {
                queryBuilder.andWhere(
                    '(file.filename ILIKE :search OR file.originalName ILIKE :search OR file.description ILIKE :search)',
                    { search: `%${search}%` }
                );
            }

            // Apply pagination
            const offset = (page - 1) * limit;
            queryBuilder.skip(offset).take(limit);

            // Order by upload date (newest first)
            queryBuilder.orderBy('file.uploadedAt', 'DESC');

            const [files, total] = await queryBuilder.getManyAndCount();

            return {
                files: files.map(file => this.entityToMetadata(file)),
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        } catch (error) {
            this.logger.error('Error listing files:', error);
            return {
                files: [],
                total: 0,
                page: options.page || 1,
                limit: options.limit || 10,
                totalPages: 0,
            };
        }
    }

    /**
     * Delete a file from both storage and database
     */
    async deleteFile(id: string): Promise<FileDeleteResult> {
        try {
            const fileMetadata = await this.getFileById(id);
            if (!fileMetadata) {
                return {
                    success: false,
                    error: 'File not found',
                };
            }

            // Delete from Supabase Storage
            const { error: storageError } = await this.supabase.storage
                .from(fileMetadata.bucketName)
                .remove([fileMetadata.path]);

            if (storageError) {
                this.logger.error('Error deleting file from Supabase Storage:', storageError);
                return {
                    success: false,
                    error: `Storage deletion failed: ${storageError.message}`,
                };
            }

            // Delete from database
            await this.fileRepository.delete(id);

            return { success: true };
        } catch (error) {
            this.logger.error('Error deleting file:', error);
            return {
                success: false,
                error: `Deletion failed: ${error.message}`,
            };
        }
    }

    /**
     * Update file metadata
     */
    async updateFileMetadata(id: string, updates: Partial<FileMetadata>): Promise<FileMetadata | null> {
        try {
            const existingFile = await this.fileRepository.findOne({ where: { id } });
            if (!existingFile) {
                return null;
            }

            // Update allowed fields
            const allowedUpdates = ['filename', 'description', 'category', 'tags', 'folder'];
            const updateData: Partial<FileEntity> = {};

            for (const key of allowedUpdates) {
                if (updates[key] !== undefined) {
                    updateData[key] = updates[key];
                }
            }

            await this.fileRepository.update(id, updateData);
            const updatedFile = await this.fileRepository.findOne({ where: { id } });

            return updatedFile ? this.entityToMetadata(updatedFile) : null;
        } catch (error) {
            this.logger.error('Error updating file metadata:', error);
            return null;
        }
    }

    /**
     * Get signed URL for temporary access to private files
     */
    async getSignedUrl(id: string, expiresIn: number = 3600): Promise<string | null> {
        try {
            const fileMetadata = await this.getFileById(id);
            if (!fileMetadata) {
                return null;
            }

            const { data, error } = await this.supabase.storage
                .from(fileMetadata.bucketName)
                .createSignedUrl(fileMetadata.path, expiresIn);

            if (error) {
                this.logger.error('Error creating signed URL:', error);
                return null;
            }

            return data.signedUrl;
        } catch (error) {
            this.logger.error('Error in getSignedUrl:', error);
            return null;
        }
    }

    /**
     * Get storage usage statistics
     */
    async getStorageStats(): Promise<{ totalFiles: number; totalSize: number; byCategory: Record<string, number> }> {
        try {
            const stats = await this.fileRepository
                .createQueryBuilder('file')
                .select([
                    'COUNT(*) as totalFiles',
                    'SUM(file.size) as totalSize',
                    'file.category',
                    'COUNT(*) as categoryCount'
                ])
                .groupBy('file.category')
                .getRawMany();

            const totalFiles = await this.fileRepository.count();
            const totalSizeResult = await this.fileRepository
                .createQueryBuilder('file')
                .select('SUM(file.size)', 'totalSize')
                .getRawOne();

            const byCategory: Record<string, number> = {};
            stats.forEach(stat => {
                byCategory[stat.file_category] = parseInt(stat.categoryCount);
            });

            return {
                totalFiles,
                totalSize: parseInt(totalSizeResult?.totalSize || '0'),
                byCategory,
            };
        } catch (error) {
            this.logger.error('Error getting storage stats:', error);
            return {
                totalFiles: 0,
                totalSize: 0,
                byCategory: {},
            };
        }
    }

    /**
     * Convert FileEntity to FileMetadata
     */
    private entityToMetadata(entity: FileEntity): FileMetadata {
        return {
            id: entity.id,
            filename: entity.filename,
            originalName: entity.originalName,
            size: entity.size,
            mimeType: entity.mimeType,
            category: entity.category,
            description: entity.description,
            tags: entity.tags,
            folder: entity.folder,
            bucketName: entity.bucketName,
            path: entity.path,
            publicUrl: entity.publicUrl,
            uploadedBy: entity.uploadedBy,
            uploadedAt: entity.uploadedAt,
            updatedAt: entity.updatedAt,
        };
    }

    /**
     * Determine file category based on MIME type
     */
    private determineCategoryFromMimeType(mimeType: string): FileCategory {
        if (mimeType.startsWith('image/')) return FileCategory.IMAGE;
        if (mimeType.startsWith('video/')) return FileCategory.VIDEO;
        if (mimeType.startsWith('audio/')) return FileCategory.AUDIO;
        if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
            return FileCategory.DOCUMENT;
        }
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
            return FileCategory.ARCHIVE;
        }
        return FileCategory.OTHER;
    }
} 