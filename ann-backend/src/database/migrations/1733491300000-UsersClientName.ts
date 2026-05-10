import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replaces users.client_id (FK) with users.client_name (varchar).
 * No FK to clients: client names are not guaranteed unique in clients table.
 */
export class UsersClientName1733491300000 implements MigrationInterface {
  name = 'UsersClientName1733491300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (!table) {
      return;
    }
    const hasClientId = table.columns.some((c) => c.name === 'client_id');
    if (!hasClientId) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "users" ADD "client_name" character varying
    `);
    await queryRunner.query(`
      UPDATE "users" u
      SET "client_name" = c."name"
      FROM "clients" c
      WHERE c."id" = u."client_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "client_name" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT "FK_users_client_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT "UQ_users_client_id_email"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "client_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "UQ_users_client_name_email" UNIQUE ("client_name", "email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (!table) {
      return;
    }
    const hasClientName = table.columns.some((c) => c.name === 'client_name');
    const hasClientId = table.columns.some((c) => c.name === 'client_id');
    if (!hasClientName || hasClientId) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT "UQ_users_client_name_email"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ADD "client_id" uuid
    `);
    await queryRunner.query(`
      UPDATE "users" u
      SET "client_id" = c."id"
      FROM "clients" c
      WHERE c."name" = u."client_name"
    `);
    await queryRunner.query(`
      DELETE FROM "users" WHERE "client_id" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "client_id" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "client_name"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "UQ_users_client_id_email" UNIQUE ("client_id", "email")
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "FK_users_client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }
}
