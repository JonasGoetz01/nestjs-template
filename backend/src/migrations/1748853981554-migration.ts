import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1748853981554 implements MigrationInterface {
    name = 'Migration1748853981554'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_files_category"`);
        await queryRunner.query(`DROP INDEX "public"."idx_files_folder"`);
        await queryRunner.query(`DROP INDEX "public"."idx_files_uploaded_by"`);
        await queryRunner.query(`DROP INDEX "public"."idx_files_uploaded_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_files_bucket_name"`);
        await queryRunner.query(`CREATE TABLE "auth"."users" ("instance_id" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "aud" character varying(255) NOT NULL, "role" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "encrypted_password" character varying(255) NOT NULL, "email_confirmed_at" TIMESTAMP WITH TIME ZONE, "invited_at" TIMESTAMP WITH TIME ZONE, "confirmation_token" character varying(255) NOT NULL DEFAULT '', "confirmation_sent_at" TIMESTAMP WITH TIME ZONE, "recovery_token" character varying(255) NOT NULL DEFAULT '', "recovery_sent_at" TIMESTAMP WITH TIME ZONE, "email_change_token_new" character varying(255) NOT NULL DEFAULT '', "email_change" character varying(255) NOT NULL DEFAULT '', "email_change_sent_at" TIMESTAMP WITH TIME ZONE, "last_sign_in_at" TIMESTAMP WITH TIME ZONE, "raw_app_meta_data" jsonb, "raw_user_meta_data" jsonb, "is_super_admin" boolean, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "phone" character varying(15), "phone_confirmed_at" TIMESTAMP WITH TIME ZONE, "phone_change" character varying(15) NOT NULL DEFAULT '', "phone_change_token" character varying(255) NOT NULL DEFAULT '', "phone_change_sent_at" TIMESTAMP WITH TIME ZONE, "confirmed_at" TIMESTAMP WITH TIME ZONE, "email_change_token_current" character varying(255) NOT NULL DEFAULT '', "email_change_confirm_status" smallint NOT NULL DEFAULT '0', "banned_until" TIMESTAMP WITH TIME ZONE, "reauthentication_token" character varying(255) NOT NULL DEFAULT '', "reauthentication_sent_at" TIMESTAMP WITH TIME ZONE, "is_sso_user" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP WITH TIME ZONE, "is_anonymous" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "category"`);
        await queryRunner.query(`CREATE TYPE "public"."files_category_enum" AS ENUM('document', 'image', 'video', 'audio', 'archive', 'other')`);
        await queryRunner.query(`ALTER TABLE "files" ADD "category" "public"."files_category_enum" NOT NULL DEFAULT 'other'`);
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "files" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "files" ADD "tags" text`);
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "uploadedAt"`);
        await queryRunner.query(`ALTER TABLE "files" ADD "uploadedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "files" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "files" ADD "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "uploadedAt"`);
        await queryRunner.query(`ALTER TABLE "files" ADD "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "files" ADD "tags" text array`);
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "files" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "category"`);
        await queryRunner.query(`DROP TYPE "public"."files_category_enum"`);
        await queryRunner.query(`ALTER TABLE "files" ADD "category" character varying NOT NULL DEFAULT 'other'`);
        await queryRunner.query(`DROP TABLE "auth"."users"`);
        await queryRunner.query(`CREATE INDEX "idx_files_bucket_name" ON "files" ("bucketName") `);
        await queryRunner.query(`CREATE INDEX "idx_files_uploaded_at" ON "files" ("uploadedAt") `);
        await queryRunner.query(`CREATE INDEX "idx_files_uploaded_by" ON "files" ("uploadedBy") `);
        await queryRunner.query(`CREATE INDEX "idx_files_folder" ON "files" ("folder") `);
        await queryRunner.query(`CREATE INDEX "idx_files_category" ON "files" ("category") `);
    }

}
