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
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME VALUE 'employer' TO 'company'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME VALUE 'company' TO 'employer'`,
    );
  }
}
