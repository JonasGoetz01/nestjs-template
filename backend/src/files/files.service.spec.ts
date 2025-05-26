import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { FilesService } from './files.service';
import { FileEntity } from './entities/file.entity';
import { FileCategory } from './interfaces/file.interface';

describe('FilesService', () => {
    let service: FilesService;
    let fileRepository: Repository<FileEntity>;
    let configService: ConfigService;

    const mockSupabaseClient = {
        storage: {
            listBuckets: jest.fn(),
            createBucket: jest.fn(),
            from: jest.fn().mockReturnThis(),
            upload: jest.fn(),
            download: jest.fn(),
            remove: jest.fn(),
            getPublicUrl: jest.fn(),
            createSignedUrl: jest.fn(),
        },
    };

    const mockFileRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            const config = {
                SUPABASE_URL: 'http://test-supabase.com',
                SUPABASE_SERVICE_KEY: 'test-key',
                SUPABASE_STORAGE_BUCKET: 'test-bucket',
                MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
            };
            return config[key];
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FilesService,
                {
                    provide: getRepositoryToken(FileEntity),
                    useValue: mockFileRepository,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<FilesService>(FilesService);
        fileRepository = module.get<Repository<FileEntity>>(getRepositoryToken(FileEntity));
        configService = module.get<ConfigService>(ConfigService);

        // Mock the supabase client
        (service as any).supabase = mockSupabaseClient;

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('initializeBucket', () => {
        it('should create bucket if it does not exist', async () => {
            mockSupabaseClient.storage.listBuckets.mockResolvedValue({
                data: [],
                error: null,
            });

            mockSupabaseClient.storage.createBucket.mockResolvedValue({
                data: { name: 'test-bucket' },
                error: null,
            });

            await service.initializeBucket('test-bucket');

            expect(mockSupabaseClient.storage.listBuckets).toHaveBeenCalledTimes(1);
            expect(mockSupabaseClient.storage.createBucket).toHaveBeenCalledWith('test-bucket', {
                public: false,
                allowedMimeTypes: undefined,
                fileSizeLimit: 10 * 1024 * 1024,
            });
        });

        it('should not create bucket if it already exists', async () => {
            mockSupabaseClient.storage.listBuckets.mockResolvedValue({
                data: [{ name: 'test-bucket' }],
                error: null,
            });

            await service.initializeBucket('test-bucket');

            expect(mockSupabaseClient.storage.listBuckets).toHaveBeenCalledTimes(1);
            expect(mockSupabaseClient.storage.createBucket).not.toHaveBeenCalled();
        });

        it('should handle errors when listing buckets', async () => {
            mockSupabaseClient.storage.listBuckets.mockResolvedValue({
                data: null,
                error: { message: 'Access denied' },
            });

            await service.initializeBucket('test-bucket');

            expect(mockSupabaseClient.storage.listBuckets).toHaveBeenCalledTimes(1);
            expect(mockSupabaseClient.storage.createBucket).not.toHaveBeenCalled();
        });
    });

    describe('uploadFile', () => {
        const mockUploadOptions = {
            filename: 'test.pdf',
            buffer: Buffer.from('test content'),
            mimeType: 'application/pdf',
            size: 1024,
            category: FileCategory.DOCUMENT,
            description: 'Test document',
            tags: ['test', 'document'],
            folder: 'documents',
            uploadedBy: 'user123',
        };

        it('should successfully upload a file', async () => {
            const mockFileEntity = {
                id: 'file-uuid',
                filename: 'test_unique-id.pdf',
                originalName: 'test.pdf',
                size: 1024,
                mimeType: 'application/pdf',
                category: FileCategory.DOCUMENT,
                description: 'Test document',
                tags: ['test', 'document'],
                folder: 'documents',
                bucketName: 'test-bucket',
                path: 'documents/test_unique-id.pdf',
                uploadedBy: 'user123',
                uploadedAt: new Date(),
                updatedAt: new Date(),
            };

            mockSupabaseClient.storage.from.mockReturnValue({
                upload: jest.fn().mockResolvedValue({
                    data: { path: 'documents/test_unique-id.pdf' },
                    error: null,
                }),
            });

            mockFileRepository.create.mockReturnValue(mockFileEntity);
            mockFileRepository.save.mockResolvedValue(mockFileEntity);

            const result = await service.uploadFile(mockUploadOptions);

            expect(result.success).toBe(true);
            expect(result.file).toBeDefined();
            expect(result.file?.filename).toContain('test_');
            expect(result.file?.originalName).toBe('test.pdf');
            expect(mockFileRepository.create).toHaveBeenCalled();
            expect(mockFileRepository.save).toHaveBeenCalled();
        });

        it('should reject file if size exceeds limit', async () => {
            const largeFileOptions = {
                ...mockUploadOptions,
                size: 20 * 1024 * 1024, // 20MB, exceeds 10MB limit
            };

            const result = await service.uploadFile(largeFileOptions);

            expect(result.success).toBe(false);
            expect(result.error).toContain('File size exceeds maximum allowed size');
            expect(mockSupabaseClient.storage.from).not.toHaveBeenCalled();
        });

        it('should reject file if MIME type is not allowed', async () => {
            const config = {
                bucketName: 'test-bucket',
                maxFileSize: 10 * 1024 * 1024,
                allowedMimeTypes: ['image/jpeg', 'image/png'],
            };

            const result = await service.uploadFile(mockUploadOptions, config);

            expect(result.success).toBe(false);
            expect(result.error).toContain('File type application/pdf is not allowed');
            expect(mockSupabaseClient.storage.from).not.toHaveBeenCalled();
        });

        it('should handle Supabase upload errors', async () => {
            mockSupabaseClient.storage.from.mockReturnValue({
                upload: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Storage quota exceeded' },
                }),
            });

            const result = await service.uploadFile(mockUploadOptions);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Upload failed: Storage quota exceeded');
            expect(mockFileRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('getFileById', () => {
        it('should return file metadata when file exists', async () => {
            const mockFileEntity = {
                id: 'file-uuid',
                filename: 'test.pdf',
                originalName: 'test.pdf',
                size: 1024,
                mimeType: 'application/pdf',
                category: FileCategory.DOCUMENT,
                bucketName: 'test-bucket',
                path: 'test.pdf',
                uploadedAt: new Date(),
                updatedAt: new Date(),
            };

            mockFileRepository.findOne.mockResolvedValue(mockFileEntity);

            const result = await service.getFileById('file-uuid');

            expect(result).toBeDefined();
            expect(result?.id).toBe('file-uuid');
            expect(result?.filename).toBe('test.pdf');
            expect(mockFileRepository.findOne).toHaveBeenCalledWith({ where: { id: 'file-uuid' } });
        });

        it('should return null when file does not exist', async () => {
            mockFileRepository.findOne.mockResolvedValue(null);

            const result = await service.getFileById('non-existent-id');

            expect(result).toBeNull();
            expect(mockFileRepository.findOne).toHaveBeenCalledWith({ where: { id: 'non-existent-id' } });
        });
    });

    describe('downloadFile', () => {
        it('should download file successfully', async () => {
            const mockFileEntity = {
                id: 'file-uuid',
                filename: 'test.pdf',
                originalName: 'test.pdf',
                size: 1024,
                mimeType: 'application/pdf',
                category: FileCategory.DOCUMENT,
                bucketName: 'test-bucket',
                path: 'test.pdf',
                uploadedAt: new Date(),
                updatedAt: new Date(),
            };

            mockFileRepository.findOne.mockResolvedValue(mockFileEntity);

            const mockBlob = new Blob(['test content']);
            mockSupabaseClient.storage.from.mockReturnValue({
                download: jest.fn().mockResolvedValue({
                    data: mockBlob,
                    error: null,
                }),
            });

            const result = await service.downloadFile('file-uuid');

            expect(result).toBeDefined();
            expect(result?.metadata.id).toBe('file-uuid');
            expect(Buffer.isBuffer(result?.buffer)).toBe(true);
        });

        it('should return null when file metadata not found', async () => {
            mockFileRepository.findOne.mockResolvedValue(null);

            const result = await service.downloadFile('non-existent-id');

            expect(result).toBeNull();
        });

        it('should return null when Supabase download fails', async () => {
            const mockFileEntity = {
                id: 'file-uuid',
                bucketName: 'test-bucket',
                path: 'test.pdf',
            };

            mockFileRepository.findOne.mockResolvedValue(mockFileEntity);

            mockSupabaseClient.storage.from.mockReturnValue({
                download: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'File not found in storage' },
                }),
            });

            const result = await service.downloadFile('file-uuid');

            expect(result).toBeNull();
        });
    });

    describe('deleteFile', () => {
        it('should delete file successfully', async () => {
            const mockFileEntity = {
                id: 'file-uuid',
                bucketName: 'test-bucket',
                path: 'test.pdf',
            };

            mockFileRepository.findOne.mockResolvedValue(mockFileEntity);

            mockSupabaseClient.storage.from.mockReturnValue({
                remove: jest.fn().mockResolvedValue({
                    data: ['test.pdf'],
                    error: null,
                }),
            });

            mockFileRepository.delete.mockResolvedValue({ affected: 1 });

            const result = await service.deleteFile('file-uuid');

            expect(result.success).toBe(true);
            expect(mockFileRepository.delete).toHaveBeenCalledWith('file-uuid');
        });

        it('should return error when file not found', async () => {
            mockFileRepository.findOne.mockResolvedValue(null);

            const result = await service.deleteFile('non-existent-id');

            expect(result.success).toBe(false);
            expect(result.error).toBe('File not found');
            expect(mockFileRepository.delete).not.toHaveBeenCalled();
        });

        it('should handle Supabase storage deletion errors', async () => {
            const mockFileEntity = {
                id: 'file-uuid',
                bucketName: 'test-bucket',
                path: 'test.pdf',
            };

            mockFileRepository.findOne.mockResolvedValue(mockFileEntity);

            mockSupabaseClient.storage.from.mockReturnValue({
                remove: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Storage deletion failed' },
                }),
            });

            const result = await service.deleteFile('file-uuid');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Storage deletion failed');
            expect(mockFileRepository.delete).not.toHaveBeenCalled();
        });
    });

    describe('listFiles', () => {
        it('should list files with pagination', async () => {
            const mockQueryBuilder = {
                andWhere: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([
                    [
                        { id: 'file1', filename: 'test1.pdf' },
                        { id: 'file2', filename: 'test2.pdf' },
                    ],
                    2,
                ]),
            };

            mockFileRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const result = await service.listFiles({ page: 1, limit: 10 });

            expect(result.files).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.totalPages).toBe(1);
        });

        it('should apply search filters', async () => {
            const mockQueryBuilder = {
                andWhere: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };

            mockFileRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            await service.listFiles({
                category: FileCategory.DOCUMENT,
                folder: 'documents',
                search: 'test',
                uploadedBy: 'user123',
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('file.category = :category', { category: FileCategory.DOCUMENT });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('file.folder = :folder', { folder: 'documents' });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('file.uploadedBy = :uploadedBy', { uploadedBy: 'user123' });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                '(file.filename ILIKE :search OR file.originalName ILIKE :search OR file.description ILIKE :search)',
                { search: '%test%' }
            );
        });
    });

    describe('getSignedUrl', () => {
        it('should generate signed URL successfully', async () => {
            const mockFileEntity = {
                id: 'file-uuid',
                bucketName: 'test-bucket',
                path: 'test.pdf',
            };

            mockFileRepository.findOne.mockResolvedValue(mockFileEntity);

            mockSupabaseClient.storage.from.mockReturnValue({
                createSignedUrl: jest.fn().mockResolvedValue({
                    data: { signedUrl: 'https://signed-url.com/test.pdf' },
                    error: null,
                }),
            });

            const result = await service.getSignedUrl('file-uuid', 3600);

            expect(result).toBe('https://signed-url.com/test.pdf');
        });

        it('should return null when file not found', async () => {
            mockFileRepository.findOne.mockResolvedValue(null);

            const result = await service.getSignedUrl('non-existent-id');

            expect(result).toBeNull();
        });

        it('should return null when signed URL generation fails', async () => {
            const mockFileEntity = {
                id: 'file-uuid',
                bucketName: 'test-bucket',
                path: 'test.pdf',
            };

            mockFileRepository.findOne.mockResolvedValue(mockFileEntity);

            mockSupabaseClient.storage.from.mockReturnValue({
                createSignedUrl: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Failed to generate signed URL' },
                }),
            });

            const result = await service.getSignedUrl('file-uuid');

            expect(result).toBeNull();
        });
    });

    describe('updateFileMetadata', () => {
        it('should update file metadata successfully', async () => {
            const existingFile = {
                id: 'file-uuid',
                filename: 'old-name.pdf',
                description: 'Old description',
            };

            const updatedFile = {
                id: 'file-uuid',
                filename: 'new-name.pdf',
                description: 'New description',
            };

            mockFileRepository.findOne
                .mockResolvedValueOnce(existingFile)
                .mockResolvedValueOnce(updatedFile);

            mockFileRepository.update.mockResolvedValue({ affected: 1 });

            const result = await service.updateFileMetadata('file-uuid', {
                filename: 'new-name.pdf',
                description: 'New description',
            });

            expect(result).toBeDefined();
            expect(result?.filename).toBe('new-name.pdf');
            expect(result?.description).toBe('New description');
            expect(mockFileRepository.update).toHaveBeenCalledWith('file-uuid', {
                filename: 'new-name.pdf',
                description: 'New description',
            });
        });

        it('should return null when file not found', async () => {
            mockFileRepository.findOne.mockResolvedValue(null);

            const result = await service.updateFileMetadata('non-existent-id', {
                filename: 'new-name.pdf',
            });

            expect(result).toBeNull();
            expect(mockFileRepository.update).not.toHaveBeenCalled();
        });
    });
}); 