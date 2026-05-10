import { MigrationInterface, QueryRunner } from 'typeorm';

export class JobPackageFeaturedCompanyListing1747500000000 implements MigrationInterface {
  name = 'JobPackageFeaturedCompanyListing1747500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "job_packages"
      ADD COLUMN IF NOT EXISTS "featured_company_listing" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "job_packages" DROP COLUMN IF EXISTS "featured_company_listing"
    `);
  }
}
