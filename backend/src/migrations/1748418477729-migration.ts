import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1748418477729 implements MigrationInterface {
    name = 'InitialMigration1748418477729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create files table
        await queryRunner.query(`
            CREATE TYPE "public"."files_category_enum" AS ENUM('image', 'document', 'video', 'audio', 'other')
        `);

        await queryRunner.query(`
            CREATE TABLE "files" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "filename" character varying NOT NULL,
                "originalName" character varying NOT NULL,
                "size" bigint NOT NULL,
                "mimeType" character varying NOT NULL,
                "category" "public"."files_category_enum" NOT NULL DEFAULT 'other',
                "description" character varying,
                "tags" text,
                "folder" character varying,
                "bucketName" character varying NOT NULL,
                "path" character varying NOT NULL,
                "publicUrl" character varying,
                "uploadedBy" character varying,
                "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_files_id" PRIMARY KEY ("id")
            )
        `);

        // Create profiles table (if not exists from Supabase)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "profiles" (
                "id" uuid NOT NULL,
                "updated_at" timestamp with time zone,
                "username" text UNIQUE,
                "avatar_url" text,
                "website" text,
                CONSTRAINT "PK_profiles_id" PRIMARY KEY ("id"),
                CONSTRAINT "profiles_username_key" UNIQUE ("username"),
                CONSTRAINT "username_length" CHECK (char_length(username) >= 3),
                CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
            )
        `);

        // Enable RLS on profiles (Supabase requirement)
        await queryRunner.query(`ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS "profiles"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "files"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."files_category_enum"`);
    }
}
