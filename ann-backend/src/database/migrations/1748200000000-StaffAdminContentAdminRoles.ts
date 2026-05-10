import { MigrationInterface, QueryRunner } from 'typeorm';

export class StaffAdminContentAdminRoles1748200000000
  implements MigrationInterface
{
  name = 'StaffAdminContentAdminRoles1748200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $do$ BEGIN
        ALTER TYPE "public"."users_role_enum" ADD VALUE 'content_admin';
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $do$
    `);
    await queryRunner.query(`
      DO $do$ BEGIN
        ALTER TYPE "public"."users_role_enum" ADD VALUE 'staff_admin';
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $do$
    `);
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot drop enum values safely here.
  }
}
