import { MigrationInterface, QueryRunner } from 'typeorm';

export class JobPostingMetadata1747300000000 implements MigrationInterface {
  name = 'JobPostingMetadata1747300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Types may already exist after a failed/partial run; columns use IF NOT EXISTS.
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."job_employment_type_enum" AS ENUM(
          'full_time',
          'part_time',
          'contract',
          'per_diem',
          'temporary'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."job_level_enum" AS ENUM(
          'intern',
          'entry',
          'mid',
          'senior',
          'lead',
          'executive'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ADD COLUMN IF NOT EXISTS "employment_type" "public"."job_employment_type_enum"
    `);
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ADD COLUMN IF NOT EXISTS "job_level" "public"."job_level_enum"
    `);
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ADD COLUMN IF NOT EXISTS "job_category" character varying(120)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN IF EXISTS "job_category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN IF EXISTS "job_level"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN IF EXISTS "employment_type"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."job_level_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."job_employment_type_enum"`,
    );
  }
}
