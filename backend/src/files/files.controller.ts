import {
    Controller,
    Post,
    Get,
    Delete,
    Put,
    Param,
    Query,
    Body,
    UploadedFile,
    UseInterceptors,
    Res,
    HttpStatus,
    ParseUUIDPipe,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBody,
    ApiConsumes,
    ApiProduces,
    ApiProperty,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { FileQueryDto, UpdateFileDto } from './dto/file.dto';
import { FileCategory } from './interfaces/file.interface';

@ApiTags('Files')
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) { }

    /**
     * Upload a single file
     */
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Upload a file',
        description: 'Upload a single file to Supabase Storage with metadata'
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'File upload with metadata',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'The file to upload'
                },
                category: {
                    type: 'string',
                    enum: Object.values(FileCategory),
                    description: 'File category'
                },
                description: {
                    type: 'string',
                    description: 'File description'
                },
                tags: {
                    type: 'string',
                    description: 'Comma-separated tags'
                },
                folder: {
                    type: 'string',
                    description: 'Folder path for organization'
                },
                uploadedBy: {
                    type: 'string',
                    description: 'User ID who uploaded the file'
                }
            },
            required: ['file']
        }
    })
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                file: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        filename: { type: 'string' },
                        originalName: { type: 'string' },
                        size: { type: 'number' },
                        mimeType: { type: 'string' },
                        category: { type: 'string' },
                        description: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                        folder: { type: 'string' },
                        bucketName: { type: 'string' },
                        path: { type: 'string' },
                        publicUrl: { type: 'string' },
                        uploadedBy: { type: 'string' },
                        uploadedAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Bad request - No file provided or validation error' })
    async uploadFile(
        @UploadedFile() file: any,
        @Body() body: any,
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        const uploadOptions = {
            filename: file.originalname,
            buffer: file.buffer,
            mimeType: file.mimetype,
            size: file.size,
            category: body.category as FileCategory,
            description: body.description,
            tags: body.tags ? body.tags.split(',').map((tag: string) => tag.trim()) : undefined,
            folder: body.folder,
            uploadedBy: body.uploadedBy,
        };

        const result = await this.filesService.uploadFile(uploadOptions);

        if (!result.success) {
            throw new BadRequestException(result.error);
        }

        return {
            message: 'File uploaded successfully',
            file: result.file,
        };
    }

    /**
     * Get file metadata by ID
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Get file metadata',
        description: 'Retrieve file metadata by ID'
    })
    @ApiParam({ name: 'id', description: 'File UUID', type: 'string' })
    @ApiResponse({
        status: 200,
        description: 'File metadata retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                filename: { type: 'string' },
                originalName: { type: 'string' },
                size: { type: 'number' },
                mimeType: { type: 'string' },
                category: { type: 'string' },
                description: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                folder: { type: 'string' },
                bucketName: { type: 'string' },
                path: { type: 'string' },
                publicUrl: { type: 'string' },
                uploadedBy: { type: 'string' },
                uploadedAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'File not found' })
    async getFile(@Param('id', ParseUUIDPipe) id: string) {
        const file = await this.filesService.getFileById(id);

        if (!file) {
            throw new NotFoundException('File not found');
        }

        return file;
    }

    /**
     * Download file content
     */
    @Get(':id/download')
    @ApiOperation({
        summary: 'Download file',
        description: 'Download file content with proper headers'
    })
    @ApiParam({ name: 'id', description: 'File UUID', type: 'string' })
    @ApiProduces('application/octet-stream')
    @ApiResponse({
        status: 200,
        description: 'File downloaded successfully',
        content: {
            'application/octet-stream': {
                schema: {
                    type: 'string',
                    format: 'binary'
                }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'File not found' })
    async downloadFile(
        @Param('id', ParseUUIDPipe) id: string,
        @Res() res: Response,
    ) {
        const result = await this.filesService.downloadFile(id);

        if (!result) {
            throw new NotFoundException('File not found');
        }

        const { buffer, metadata } = result;

        res.set({
            'Content-Type': metadata.mimeType,
            'Content-Disposition': `attachment; filename="${metadata.originalName}"`,
            'Content-Length': metadata.size.toString(),
        });

        res.send(buffer);
    }

    /**
     * Get signed URL for temporary access
     */
    @Get(':id/signed-url')
    @ApiOperation({
        summary: 'Get signed URL',
        description: 'Generate a temporary signed URL for file access'
    })
    @ApiParam({ name: 'id', description: 'File UUID', type: 'string' })
    @ApiQuery({
        name: 'expiresIn',
        description: 'URL expiration time in seconds (default: 3600)',
        required: false,
        type: 'number'
    })
    @ApiResponse({
        status: 200,
        description: 'Signed URL generated successfully',
        schema: {
            type: 'object',
            properties: {
                signedUrl: { type: 'string', description: 'Temporary access URL' }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'File not found or unable to generate signed URL' })
    async getSignedUrl(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('expiresIn') expiresIn?: string,
    ) {
        const expires = expiresIn ? parseInt(expiresIn) : 3600;
        const signedUrl = await this.filesService.getSignedUrl(id, expires);

        if (!signedUrl) {
            throw new NotFoundException('File not found or unable to generate signed URL');
        }

        return { signedUrl };
    }

    /**
     * List files with filtering and pagination
     */
    @Get()
    @ApiOperation({
        summary: 'List files',
        description: 'List files with filtering, searching, and pagination'
    })
    @ApiQuery({ name: 'category', enum: FileCategory, required: false, description: 'Filter by file category' })
    @ApiQuery({ name: 'folder', type: 'string', required: false, description: 'Filter by folder path' })
    @ApiQuery({ name: 'search', type: 'string', required: false, description: 'Search in filename, original name, or description' })
    @ApiQuery({ name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', type: 'number', required: false, description: 'Items per page (default: 10)' })
    @ApiResponse({
        status: 200,
        description: 'Files listed successfully',
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            filename: { type: 'string' },
                            originalName: { type: 'string' },
                            size: { type: 'number' },
                            mimeType: { type: 'string' },
                            category: { type: 'string' },
                            description: { type: 'string' },
                            tags: { type: 'array', items: { type: 'string' } },
                            folder: { type: 'string' },
                            bucketName: { type: 'string' },
                            path: { type: 'string' },
                            publicUrl: { type: 'string' },
                            uploadedBy: { type: 'string' },
                            uploadedAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                totalPages: { type: 'number' }
            }
        }
    })
    async listFiles(@Query() query: FileQueryDto) {
        const options = {
            category: query.category,
            folder: query.folder,
            search: query.search,
            page: query.page || 1,
            limit: query.limit || 10,
        };

        return await this.filesService.listFiles(options);
    }

    /**
     * Update file metadata
     */
    @Put(':id')
    @ApiOperation({
        summary: 'Update file metadata',
        description: 'Update file metadata (filename, description, category, tags, folder)'
    })
    @ApiParam({ name: 'id', description: 'File UUID', type: 'string' })
    @ApiBody({
        description: 'File metadata updates',
        schema: {
            type: 'object',
            properties: {
                filename: { type: 'string', description: 'New filename' },
                description: { type: 'string', description: 'New description' },
                category: { type: 'string', enum: Object.values(FileCategory), description: 'New category' },
                tags: { type: 'string', description: 'Comma-separated tags' },
                folder: { type: 'string', description: 'New folder path' }
            }
        }
    })
    @ApiResponse({
        status: 200,
        description: 'File updated successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                file: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        filename: { type: 'string' },
                        originalName: { type: 'string' },
                        size: { type: 'number' },
                        mimeType: { type: 'string' },
                        category: { type: 'string' },
                        description: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                        folder: { type: 'string' },
                        bucketName: { type: 'string' },
                        path: { type: 'string' },
                        publicUrl: { type: 'string' },
                        uploadedBy: { type: 'string' },
                        uploadedAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'File not found' })
    async updateFile(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateFileDto,
    ) {
        const updates = {
            ...updateDto,
            tags: updateDto.tags ? updateDto.tags.split(',').map(tag => tag.trim()) : undefined,
        };

        const updatedFile = await this.filesService.updateFileMetadata(id, updates);

        if (!updatedFile) {
            throw new NotFoundException('File not found');
        }

        return {
            message: 'File updated successfully',
            file: updatedFile,
        };
    }

    /**
     * Delete a file
     */
    @Delete(':id')
    @ApiOperation({
        summary: 'Delete file',
        description: 'Delete a file from both storage and database'
    })
    @ApiParam({ name: 'id', description: 'File UUID', type: 'string' })
    @ApiResponse({
        status: 200,
        description: 'File deleted successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'File not found' })
    @ApiResponse({ status: 400, description: 'Deletion failed' })
    async deleteFile(@Param('id', ParseUUIDPipe) id: string) {
        const result = await this.filesService.deleteFile(id);

        if (!result.success) {
            if (result.error === 'File not found') {
                throw new NotFoundException(result.error);
            }
            throw new BadRequestException(result.error);
        }

        return { message: 'File deleted successfully' };
    }

    /**
     * Get storage statistics
     */
    @Get('admin/stats')
    @ApiOperation({
        summary: 'Get storage statistics',
        description: 'Get storage usage statistics and analytics'
    })
    @ApiResponse({
        status: 200,
        description: 'Storage statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                totalFiles: { type: 'number', description: 'Total number of files' },
                totalSize: { type: 'number', description: 'Total size in bytes' },
                byCategory: {
                    type: 'object',
                    description: 'File count by category',
                    additionalProperties: { type: 'number' }
                }
            }
        }
    })
    async getStorageStats() {
        return await this.filesService.getStorageStats();
    }

    /**
     * Initialize storage bucket
     */
    @Post('admin/init-bucket')
    @ApiOperation({
        summary: 'Initialize storage bucket',
        description: 'Initialize Supabase storage bucket if it does not exist'
    })
    @ApiBody({
        description: 'Bucket configuration',
        schema: {
            type: 'object',
            properties: {
                bucketName: {
                    type: 'string',
                    description: 'Bucket name (optional, uses default if not provided)'
                }
            }
        },
        required: false
    })
    @ApiResponse({
        status: 201,
        description: 'Bucket initialization completed',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' }
            }
        }
    })
    async initializeBucket(@Body('bucketName') bucketName?: string) {
        await this.filesService.initializeBucket(bucketName);
        return { message: 'Bucket initialization completed' };
    }

    /**
     * List files by category
     */
    @Get('category/:category')
    @ApiOperation({
        summary: 'List files by category',
        description: 'List files filtered by specific category'
    })
    @ApiParam({ name: 'category', enum: FileCategory, description: 'File category to filter by' })
    @ApiQuery({ name: 'folder', type: 'string', required: false, description: 'Filter by folder path' })
    @ApiQuery({ name: 'search', type: 'string', required: false, description: 'Search in filename, original name, or description' })
    @ApiQuery({ name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', type: 'number', required: false, description: 'Items per page (default: 10)' })
    @ApiResponse({
        status: 200,
        description: 'Files listed successfully',
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            filename: { type: 'string' },
                            originalName: { type: 'string' },
                            size: { type: 'number' },
                            mimeType: { type: 'string' },
                            category: { type: 'string' },
                            description: { type: 'string' },
                            tags: { type: 'array', items: { type: 'string' } },
                            folder: { type: 'string' },
                            bucketName: { type: 'string' },
                            path: { type: 'string' },
                            publicUrl: { type: 'string' },
                            uploadedBy: { type: 'string' },
                            uploadedAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                totalPages: { type: 'number' }
            }
        }
    })
    async getFilesByCategory(
        @Param('category') category: FileCategory,
        @Query() query: Omit<FileQueryDto, 'category'>,
    ) {
        const options = {
            ...query,
            category,
            page: query.page || 1,
            limit: query.limit || 10,
        };

        return await this.filesService.listFiles(options);
    }

    /**
     * List files in a specific folder
     */
    @Get('folder/:folder')
    @ApiOperation({
        summary: 'List files by folder',
        description: 'List files in a specific folder path'
    })
    @ApiParam({ name: 'folder', type: 'string', description: 'Folder path to filter by' })
    @ApiQuery({ name: 'category', enum: FileCategory, required: false, description: 'Filter by file category' })
    @ApiQuery({ name: 'search', type: 'string', required: false, description: 'Search in filename, original name, or description' })
    @ApiQuery({ name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', type: 'number', required: false, description: 'Items per page (default: 10)' })
    @ApiResponse({
        status: 200,
        description: 'Files listed successfully',
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            filename: { type: 'string' },
                            originalName: { type: 'string' },
                            size: { type: 'number' },
                            mimeType: { type: 'string' },
                            category: { type: 'string' },
                            description: { type: 'string' },
                            tags: { type: 'array', items: { type: 'string' } },
                            folder: { type: 'string' },
                            bucketName: { type: 'string' },
                            path: { type: 'string' },
                            publicUrl: { type: 'string' },
                            uploadedBy: { type: 'string' },
                            uploadedAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                totalPages: { type: 'number' }
            }
        }
    })
    async getFilesByFolder(
        @Param('folder') folder: string,
        @Query() query: Omit<FileQueryDto, 'folder'>,
    ) {
        const options = {
            ...query,
            folder,
            page: query.page || 1,
            limit: query.limit || 10,
        };

        return await this.filesService.listFiles(options);
    }
} 