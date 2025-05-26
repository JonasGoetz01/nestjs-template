import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileEntity } from './entities/file.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([FileEntity]),
        ConfigModule,
    ],
    controllers: [FilesController],
    providers: [FilesService],
    exports: [FilesService], // Export service for use in other modules
})
export class FilesModule { } 