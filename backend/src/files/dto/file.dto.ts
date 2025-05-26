import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileCategory } from '../interfaces/file.interface';

export class UploadFileDto {
    @ApiProperty({ description: 'Original filename' })
    filename: string;

    @ApiPropertyOptional({ description: 'File description' })
    description?: string;

    @ApiPropertyOptional({
        enum: FileCategory,
        description: 'File category (auto-detected if not provided)'
    })
    category?: FileCategory;

    @ApiPropertyOptional({ description: 'Comma-separated tags' })
    tags?: string;

    @ApiPropertyOptional({ description: 'Folder path for organization' })
    folder?: string;
}

export class FileQueryDto {
    @ApiPropertyOptional({
        enum: FileCategory,
        description: 'Filter by file category'
    })
    category?: FileCategory;

    @ApiPropertyOptional({ description: 'Filter by folder path' })
    folder?: string;

    @ApiPropertyOptional({ description: 'Search in filename, original name, or description' })
    search?: string;

    @ApiPropertyOptional({
        type: 'number',
        default: 1,
        description: 'Page number'
    })
    page?: number = 1;

    @ApiPropertyOptional({
        type: 'number',
        default: 10,
        description: 'Items per page'
    })
    limit?: number = 10;
}

export class UpdateFileDto {
    @ApiPropertyOptional({ description: 'New filename' })
    filename?: string;

    @ApiPropertyOptional({ description: 'New description' })
    description?: string;

    @ApiPropertyOptional({
        enum: FileCategory,
        description: 'New category'
    })
    category?: FileCategory;

    @ApiPropertyOptional({ description: 'Comma-separated tags' })
    tags?: string;

    @ApiPropertyOptional({ description: 'New folder path' })
    folder?: string;
} 