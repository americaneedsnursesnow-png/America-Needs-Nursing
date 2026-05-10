import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClientFreeTierLimitAndDropFreeJobConsumed1748100000000
  implements MigrationInterface
{
  name = 'ClientFreeTierLimitAndDropFreeJobConsumed1748100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clients"
      ADD COLUMN IF NOT EXISTS "free_tier_job_posts_per_month" integer
      NOT NULL DEFAULT 5
    `);

    await queryRunner.query(`
      ALTER TABLE "companies" DROP COLUMN IF EXISTS "free_job_consumed"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN IF NOT EXISTS "free_job_consumed" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "clients" DROP COLUMN IF EXISTS "free_tier_job_posts_per_month"
    `);
  }
}
