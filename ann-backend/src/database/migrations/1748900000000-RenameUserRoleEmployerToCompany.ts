import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renames PostgreSQL enum label `employer` → `company` for `users.role`.
 * Requires PostgreSQL 15+ (`ALTER TYPE ... RENAME VALUE`).
 */
export class RenameUserRoleEmployerToCompany1748900000000
  implements MigrationInterface
{
  name = 'RenameUserRoleEmployerToCompany1748900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = (await queryRunner.query(
      `SELECT 1
       FROM pg_enum e
       INNER JOIN pg_type t ON e.enumtypid = t.oid
       WHERE t.typname = 'users_role_enum'
         AND e.enumlabel = 'employer'
       LIMIT 1`,
    )) as unknown[];
    if (rows.length === 0) {
      return;
    }
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME VALUE 'employer' TO 'company'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasCompany = (await queryRunner.query(
      `SELECT 1
       FROM pg_enum e
       INNER JOIN pg_type t ON e.enumtypid = t.oid
       WHERE t.typname = 'users_role_enum'
         AND e.enumlabel = 'company'
       LIMIT 1`,
    )) as unknown[];
    const hasEmployer = (await queryRunner.query(
      `SELECT 1
       FROM pg_enum e
       INNER JOIN pg_type t ON e.enumtypid = t.oid
       WHERE t.typname = 'users_role_enum'
         AND e.enumlabel = 'employer'
       LIMIT 1`,
    )) as unknown[];
    if (hasCompany.length === 0 || hasEmployer.length > 0) {
      return;
    }
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME VALUE 'company' TO 'employer'`,
    );
  }
}
