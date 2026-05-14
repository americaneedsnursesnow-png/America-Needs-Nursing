import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompanyLastPurchasedJobPackageId1749200000000
  implements MigrationInterface
{
  name = 'CompanyLastPurchasedJobPackageId1749200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN IF NOT EXISTS "last_purchased_job_package_id" uuid
    `);
    await queryRunner.query(`
      UPDATE "companies"
      SET "last_purchased_job_package_id" = "job_package_id"
      WHERE "job_package_id" IS NOT NULL
        AND "last_purchased_job_package_id" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies" DROP COLUMN IF EXISTS "last_purchased_job_package_id"
    `);
  }
}
