import { MigrationInterface, QueryRunner } from 'typeorm';

export class JobPackageFeaturedAndPurchaseSnapshot1747200000000 implements MigrationInterface {
  name = 'JobPackageFeaturedAndPurchaseSnapshot1747200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Schema may already include these columns (e.g. manual sync); keep migration safe to re-run.
    await queryRunner.query(`
      ALTER TABLE "job_packages"
      ADD COLUMN IF NOT EXISTS "featured_job_limit" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN IF NOT EXISTS "job_package_purchase_snapshot" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies" DROP COLUMN IF EXISTS "job_package_purchase_snapshot"
    `);
    await queryRunner.query(`
      ALTER TABLE "job_packages" DROP COLUMN IF EXISTS "featured_job_limit"
    `);
  }
}
