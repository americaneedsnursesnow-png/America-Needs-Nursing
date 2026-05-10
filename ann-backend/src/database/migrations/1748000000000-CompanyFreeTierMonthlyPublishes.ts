import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompanyFreeTierMonthlyPublishes1748000000000
  implements MigrationInterface
{
  name = 'CompanyFreeTierMonthlyPublishes1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN IF NOT EXISTS "free_tier_yyyymm" character varying(6),
      ADD COLUMN IF NOT EXISTS "free_tier_published_count" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP COLUMN IF EXISTS "free_tier_published_count",
      DROP COLUMN IF EXISTS "free_tier_yyyymm"
    `);
  }
}
