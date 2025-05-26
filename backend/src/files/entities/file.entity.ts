import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { FileCategory } from '../interfaces/file.interface';

@Entity('files')
export class FileEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    filename: string;

    @Column()
    originalName: string;

    @Column('bigint')
    size: number;

    @Column()
    mimeType: string;

    @Column({
        type: 'enum',
        enum: FileCategory,
        default: FileCategory.OTHER,
    })
    category: FileCategory;

    @Column({ nullable: true })
    description?: string;

    @Column('simple-array', { nullable: true })
    tags?: string[];

    @Column({ nullable: true })
    folder?: string;

    @Column()
    bucketName: string;

    @Column()
    path: string;

    @Column({ nullable: true })
    publicUrl?: string;

    @Column({ nullable: true })
    uploadedBy?: string;

    @CreateDateColumn()
    uploadedAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 