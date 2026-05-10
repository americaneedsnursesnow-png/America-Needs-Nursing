import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompanyJobPackagePlanTitle1747100000000 implements MigrationInterface {
  name = 'CompanyJobPackagePlanTitle1747100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN IF NOT EXISTS "job_package_plan_title" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP COLUMN IF EXISTS "job_package_plan_title"
    `);
  }
}
