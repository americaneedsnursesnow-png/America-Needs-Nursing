import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserProfilePhotoUrl1746400000000 implements MigrationInterface {
  name = 'UserProfilePhotoUrl1746400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_photo_url" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_photo_url"
    `);
  }
}
