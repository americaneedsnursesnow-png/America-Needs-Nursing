import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The `staff_admin` role is retired; reassign to `admin` (ops admin).
 * The enum value may remain in PostgreSQL (drop not supported in-place).
 */
export class MigrateStaffAdminUsersToAdmin1748300000000
  implements MigrationInterface
{
  name = 'MigrateStaffAdminUsersToAdmin1748300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
   await queryRunner.query(`
    UPDATE "users"
    SET "role" = 'admin'::text::users_role_enum
    WHERE "role"::text = 'staff_admin'
`);
  }

  public async down(): Promise<void> {
    // Non-reversible without knowing previous rows
  }
}
