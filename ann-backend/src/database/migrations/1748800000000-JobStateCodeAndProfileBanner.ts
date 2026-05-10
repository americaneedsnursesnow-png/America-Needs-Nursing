import { MigrationInterface, QueryRunner } from 'typeorm';

export class JobStateCodeAndProfileBanner1748800000000
  implements MigrationInterface
{
  name = 'JobStateCodeAndProfileBanner1748800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ADD COLUMN IF NOT EXISTS "state_code" character varying(2)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "profile_banner_url" character varying(512)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_banner_url"
    `);
    await queryRunner.query(`
      ALTER TABLE "jobs" DROP COLUMN IF EXISTS "state_code"
    `);
  }
}
