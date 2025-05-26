# Files Service

A comprehensive file management service for NestJS applications that uses Supabase Storage for file storage and TypeORM for metadata management.

## Features

- **File Upload**: Upload files to Supabase Storage buckets
- **File Download**: Download files with proper content headers
- **File Management**: List, search, filter, and paginate files
- **Metadata Storage**: Store file metadata in database with TypeORM
- **File Categories**: Organize files by category (document, image, video, audio, archive, other)
- **Folder Organization**: Organize files in folders/directories
- **Access Control**: Generate signed URLs for temporary access
- **File Validation**: Size limits and MIME type restrictions
- **Storage Statistics**: Get usage statistics and analytics
- **Automatic Categorization**: Auto-detect file categories based on MIME type

## Installation

1. Install required dependencies:
```bash
npm install @supabase/supabase-js uuid @types/uuid @nestjs/platform-express
```

2. Add environment variables to your `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
SUPABASE_STORAGE_BUCKET=files
MAX_FILE_SIZE=104857600  # 100MB in bytes
```

3. Import the FilesModule in your app module:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from './files/files.module';
import { FileEntity } from './files/entities/file.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // your database config
      entities: [FileEntity], // Add FileEntity to your entities
    }),
    FilesModule,
  ],
})
export class AppModule {}
```

## Database Setup

The service uses a `files` table to store file metadata. Make sure to run migrations or create the table with the following structure:

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR NOT NULL,
  originalName VARCHAR NOT NULL,
  size BIGINT NOT NULL,
  mimeType VARCHAR NOT NULL,
  category VARCHAR NOT NULL DEFAULT 'other',
  description TEXT,
  tags TEXT[],
  folder VARCHAR,
  bucketName VARCHAR NOT NULL,
  path VARCHAR NOT NULL,
  publicUrl VARCHAR,
  uploadedBy VARCHAR,
  uploadedAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Upload File
```http
POST /files/upload
Content-Type: multipart/form-data

file: [binary file data]
category: document|image|video|audio|archive|other
description: Optional description
tags: comma,separated,tags
folder: optional/folder/path
uploadedBy: user_id
```

### Get File Metadata
```http
GET /files/:id
```

### Download File
```http
GET /files/:id/download
```

### Get Signed URL
```http
GET /files/:id/signed-url?expiresIn=3600
```

### List Files
```http
GET /files?category=document&folder=documents&search=test&page=1&limit=10
```

### Update File Metadata
```http
PUT /files/:id
Content-Type: application/json

{
  "filename": "new-name.pdf",
  "description": "Updated description",
  "category": "document",
  "tags": "tag1,tag2,tag3"
}
```

### Delete File
```http
DELETE /files/:id
```

### Get Storage Statistics
```http
GET /files/admin/stats
```

### Initialize Storage Bucket
```http
POST /files/admin/init-bucket
Content-Type: application/json

{
  "bucketName": "custom-bucket"
}
```

## Usage in Other Services

### Basic Usage

```typescript
import { Injectable } from '@nestjs/common';
import { FilesService } from './files/files.service';
import { FileCategory } from './files/interfaces/file.interface';

@Injectable()
export class MyService {
  constructor(private readonly filesService: FilesService) {}

  async uploadDocument(fileBuffer: Buffer, filename: string, userId: string) {
    const result = await this.filesService.uploadFile({
      filename,
      buffer: fileBuffer,
      mimeType: 'application/pdf',
      size: fileBuffer.length,
      category: FileCategory.DOCUMENT,
      folder: `users/${userId}/documents`,
      uploadedBy: userId,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.file;
  }
}
```

### Advanced Configuration

```typescript
const config = {
  bucketName: 'custom-bucket',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png'],
  publicAccess: true,
};

const result = await this.filesService.uploadFile(uploadOptions, config);
```

### Module Integration

```typescript
import { Module } from '@nestjs/common';
import { FilesModule } from './files/files.module';
import { MyService } from './my.service';

@Module({
  imports: [FilesModule],
  providers: [MyService],
})
export class MyModule {}
```

## File Categories

The service automatically categorizes files based on MIME type:

- **DOCUMENT**: PDF, Word docs, text files
- **IMAGE**: JPEG, PNG, GIF, WebP, etc.
- **VIDEO**: MP4, AVI, MOV, etc.
- **AUDIO**: MP3, WAV, FLAC, etc.
- **ARCHIVE**: ZIP, RAR, TAR, etc.
- **OTHER**: Everything else

## Security Features

- **File Size Validation**: Configurable maximum file size limits
- **MIME Type Validation**: Restrict allowed file types
- **Signed URLs**: Temporary access URLs that expire
- **Folder-based Access Control**: Organize files by user/entity
- **Metadata Validation**: Sanitize and validate file metadata

## Error Handling

The service returns structured error responses:

```typescript
interface FileUploadResult {
  success: boolean;
  file?: FileMetadata;
  error?: string;
}
```

Common error scenarios:
- File size exceeds limit
- Invalid MIME type
- Storage quota exceeded
- Network/connectivity issues
- Permission denied

## Performance Considerations

- **Pagination**: Use pagination for large file lists
- **Indexing**: Database indexes on frequently queried fields
- **Caching**: Consider caching file metadata for frequently accessed files
- **Streaming**: Large file downloads use streaming
- **Cleanup**: Regular cleanup of orphaned files

## Testing

Run the test suite:
```bash
npm test -- files.service.spec.ts
```

The service includes comprehensive unit tests covering:
- File upload/download operations
- Error handling scenarios
- Metadata management
- Storage bucket operations
- Access control features

## Examples

See `examples/usage-example.ts` for detailed examples of:
- Document management service
- Profile image service
- File attachment service
- Integration patterns

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `http://kong:8000` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Demo key |
| `SUPABASE_STORAGE_BUCKET` | Default storage bucket | `files` |
| `MAX_FILE_SIZE` | Maximum file size in bytes | `104857600` (100MB) |

### Storage Configuration

```typescript
interface StorageConfig {
  bucketName: string;
  maxFileSize: number;
  allowedMimeTypes?: string[];
  publicAccess?: boolean;
}
```

## Troubleshooting

### Common Issues

1. **Bucket not found**: Initialize the bucket using `/files/admin/init-bucket`
2. **Permission denied**: Check Supabase service key permissions
3. **File size limit**: Adjust `MAX_FILE_SIZE` environment variable
4. **MIME type rejected**: Check `allowedMimeTypes` configuration

### Debugging

Enable debug logging by setting the log level:
```typescript
// In your main.ts or app configuration
app.useLogger(['error', 'warn', 'log', 'debug']);
```

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation for API changes
4. Ensure all tests pass before submitting

## License

This file service is part of your NestJS application and follows the same license terms. 