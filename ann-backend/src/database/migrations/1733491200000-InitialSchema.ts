import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1733491200000 implements MigrationInterface {
  name = 'InitialSchema1733491200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('clients')) {
      return;
    }

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clients" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('nurse', 'employer', 'super_admin')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_client_name_email" UNIQUE ("client_name", "email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('users')) {
      await queryRunner.query(`DROP TABLE "users"`);
    }
    const enumExistsRows = (await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = 'users_role_enum'`,
    )) as unknown[];
    if (enumExistsRows.length > 0) {
      await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }
    if (await queryRunner.hasTable('clients')) {
      await queryRunner.query(`DROP TABLE "clients"`);
    }
  }
}
