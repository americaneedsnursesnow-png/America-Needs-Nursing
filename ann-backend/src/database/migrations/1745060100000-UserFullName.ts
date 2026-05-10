import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserFullName1745060100000 implements MigrationInterface {
  name = 'UserFullName1745060100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "full_name"
    `);
  }
}
