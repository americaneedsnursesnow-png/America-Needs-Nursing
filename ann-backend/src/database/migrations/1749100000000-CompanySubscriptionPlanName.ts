import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompanySubscriptionPlanName1749100000000
  implements MigrationInterface
{
  name = 'CompanySubscriptionPlanName1749100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN IF NOT EXISTS "subscription_plan_name" character varying(255)
    `);

    const hasLegacyActive = (await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'companies'
        AND column_name = 'subscription_active'
      LIMIT 1
    `)) as unknown[];

    if (Array.isArray(hasLegacyActive) && hasLegacyActive.length > 0) {
      await queryRunner.query(`
        UPDATE "companies"
        SET "subscription_plan_name" = 'Legacy partner subscription'
        WHERE "subscription_active" = true
      `);
      await queryRunner.query(`
        ALTER TABLE "companies" DROP COLUMN IF EXISTS "subscription_active"
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN IF NOT EXISTS "subscription_active" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      UPDATE "companies"
      SET "subscription_active" = true
      WHERE "subscription_plan_name" IS NOT NULL
        AND TRIM("subscription_plan_name"::text) <> ''
    `);
    await queryRunner.query(`
      ALTER TABLE "companies" DROP COLUMN IF EXISTS "subscription_plan_name"
    `);
  }
}
