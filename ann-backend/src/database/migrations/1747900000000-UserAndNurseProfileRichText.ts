import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserAndNurseProfileRichText1747900000000
  implements MigrationInterface
{
  name = 'UserAndNurseProfileRichText1747900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "description" text,
      ADD COLUMN IF NOT EXISTS "culture_text" text
    `);

    await queryRunner.query(`
      ALTER TABLE "nurse_profiles"
      ADD COLUMN IF NOT EXISTS "description" text,
      ADD COLUMN IF NOT EXISTS "culture_text" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "nurse_profiles"
      DROP COLUMN IF EXISTS "culture_text",
      DROP COLUMN IF EXISTS "description"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "culture_text",
      DROP COLUMN IF EXISTS "description"
    `);
  }
}
