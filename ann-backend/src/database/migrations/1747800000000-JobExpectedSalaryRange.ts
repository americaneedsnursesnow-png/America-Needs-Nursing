import { MigrationInterface, QueryRunner } from 'typeorm';

export class JobExpectedSalaryRange1747800000000 implements MigrationInterface {
  name = 'JobExpectedSalaryRange1747800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ADD COLUMN IF NOT EXISTS "expected_salary_range" character varying(24)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN IF EXISTS "expected_salary_range"`,
    );
  }
}
