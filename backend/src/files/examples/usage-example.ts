import { Injectable } from '@nestjs/common';
import { FilesService } from '../files.service';
import { FileCategory } from '../interfaces/file.interface';

/**
 * Example service showing how to use FilesService in other services
 */
@Injectable()
export class DocumentService {
    constructor(private readonly filesService: FilesService) { }

    /**
     * Example: Upload a user document
     */
    async uploadUserDocument(
        file: Buffer,
        filename: string,
        mimeType: string,
        userId: string,
        description?: string,
    ) {
        const uploadOptions = {
            filename,
            buffer: file,
            mimeType,
            size: file.length,
            category: FileCategory.DOCUMENT,
            description,
            folder: `users/${userId}/documents`,
            uploadedBy: userId,
        };

        const result = await this.filesService.uploadFile(uploadOptions);

        if (!result.success) {
            throw new Error(`Failed to upload document: ${result.error}`);
        }

        return result.file;
    }

    /**
     * Example: Get all documents for a user
     */
    async getUserDocuments(userId: string, page = 1, limit = 10) {
        return await this.filesService.listFiles({
            folder: `users/${userId}/documents`,
            category: FileCategory.DOCUMENT,
            page,
            limit,
        });
    }

    /**
     * Example: Download a document
     */
    async downloadDocument(documentId: string, userId: string) {
        const file = await this.filesService.getFileById(documentId);

        if (!file) {
            throw new Error('Document not found');
        }

        // Check if user owns the document
        if (!file.folder?.includes(`users/${userId}`)) {
            throw new Error('Access denied');
        }

        return await this.filesService.downloadFile(documentId);
    }

    /**
     * Example: Get temporary access URL for a document
     */
    async getDocumentAccessUrl(documentId: string, userId: string, expiresIn = 3600) {
        const file = await this.filesService.getFileById(documentId);

        if (!file) {
            throw new Error('Document not found');
        }

        // Check if user owns the document
        if (!file.folder?.includes(`users/${userId}`)) {
            throw new Error('Access denied');
        }

        return await this.filesService.getSignedUrl(documentId, expiresIn);
    }

    /**
     * Example: Delete a user document
     */
    async deleteUserDocument(documentId: string, userId: string) {
        const file = await this.filesService.getFileById(documentId);

        if (!file) {
            throw new Error('Document not found');
        }

        // Check if user owns the document
        if (!file.folder?.includes(`users/${userId}`)) {
            throw new Error('Access denied');
        }

        const result = await this.filesService.deleteFile(documentId);

        if (!result.success) {
            throw new Error(`Failed to delete document: ${result.error}`);
        }

        return { message: 'Document deleted successfully' };
    }
}

/**
 * Example service for handling profile images
 */
@Injectable()
export class ProfileImageService {
    constructor(private readonly filesService: FilesService) { }

    /**
     * Upload user profile image
     */
    async uploadProfileImage(
        imageBuffer: Buffer,
        filename: string,
        mimeType: string,
        userId: string,
    ) {
        // Validate image type
        if (!mimeType.startsWith('image/')) {
            throw new Error('Only image files are allowed for profile pictures');
        }

        const uploadOptions = {
            filename,
            buffer: imageBuffer,
            mimeType,
            size: imageBuffer.length,
            category: FileCategory.IMAGE,
            description: 'Profile image',
            folder: `users/${userId}/profile`,
            uploadedBy: userId,
        };

        // Configure for public access
        const config = {
            bucketName: 'profile-images',
            maxFileSize: 5 * 1024 * 1024, // 5MB limit for images
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            publicAccess: true,
        };

        const result = await this.filesService.uploadFile(uploadOptions, config);

        if (!result.success) {
            throw new Error(`Failed to upload profile image: ${result.error}`);
        }

        return result.file;
    }

    /**
     * Get user's profile image
     */
    async getProfileImage(userId: string) {
        const images = await this.filesService.listFiles({
            folder: `users/${userId}/profile`,
            category: FileCategory.IMAGE,
            limit: 1,
        });

        return images.files[0] || null;
    }
}

/**
 * Example service for handling file attachments in messages/posts
 */
@Injectable()
export class AttachmentService {
    constructor(private readonly filesService: FilesService) { }

    /**
     * Upload multiple attachments
     */
    async uploadAttachments(
        files: Array<{ buffer: Buffer; filename: string; mimeType: string }>,
        entityType: 'message' | 'post',
        entityId: string,
        uploadedBy: string,
    ) {
        const uploadPromises = files.map(async (file) => {
            const uploadOptions = {
                filename: file.filename,
                buffer: file.buffer,
                mimeType: file.mimeType,
                size: file.buffer.length,
                folder: `${entityType}s/${entityId}/attachments`,
                uploadedBy,
            };

            return await this.filesService.uploadFile(uploadOptions);
        });

        const results = await Promise.all(uploadPromises);

        const successful = results.filter(r => r.success).map(r => r.file);
        const failed = results.filter(r => !r.success).map(r => r.error);

        return {
            successful,
            failed,
            totalUploaded: successful.length,
            totalFailed: failed.length,
        };
    }

    /**
     * Get attachments for an entity
     */
    async getAttachments(entityType: 'message' | 'post', entityId: string) {
        return await this.filesService.listFiles({
            folder: `${entityType}s/${entityId}/attachments`,
        });
    }
}

/**
 * Example module showing how to integrate FilesService
 */
import { Module } from '@nestjs/common';
import { FilesModule } from '../files.module';

@Module({
    imports: [FilesModule], // Import FilesModule to get access to FilesService
    providers: [DocumentService, ProfileImageService, AttachmentService],
    exports: [DocumentService, ProfileImageService, AttachmentService],
})
export class ExampleUsageModule { }

/**
 * Example controller showing how to use the services
 */
import { Controller, Post, Get, Delete, Param, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user-documents')
export class UserDocumentsController {
    constructor(private readonly documentService: DocumentService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadDocument(
        @UploadedFile() file: any,
        @Body('userId') userId: string,
        @Body('description') description?: string,
    ) {
        return await this.documentService.uploadUserDocument(
            file.buffer,
            file.originalname,
            file.mimetype,
            userId,
            description,
        );
    }

    @Get(':userId')
    async getUserDocuments(
        @Param('userId') userId: string,
    ) {
        return await this.documentService.getUserDocuments(userId);
    }

    @Delete(':documentId')
    async deleteDocument(
        @Param('documentId') documentId: string,
        @Body('userId') userId: string,
    ) {
        return await this.documentService.deleteUserDocument(documentId, userId);
    }
} 