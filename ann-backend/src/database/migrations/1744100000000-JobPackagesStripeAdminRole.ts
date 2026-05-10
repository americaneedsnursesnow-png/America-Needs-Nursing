import { MigrationInterface, QueryRunner } from 'typeorm';

export class JobPackagesStripeAdminRole1744100000000 implements MigrationInterface {
  name = 'JobPackagesStripeAdminRole1744100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $do$ BEGIN
        ALTER TYPE "public"."users_role_enum" ADD VALUE 'admin';
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $do$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_packages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "published_job_limit" integer NOT NULL,
        "is_unlimited" boolean NOT NULL DEFAULT false,
        "price_cents" integer NOT NULL DEFAULT 0,
        "currency" character varying(3) NOT NULL DEFAULT 'usd',
        "stripe_price_id" character varying,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_job_packages" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_job_packages_client" ON "job_packages" ("client_name")`,
    );

    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN IF NOT EXISTS "job_package_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN IF NOT EXISTS "job_package_expires_at" TIMESTAMPTZ
    `);
    await queryRunner.query(`
      DO $fk$ BEGIN
        ALTER TABLE "companies"
        ADD CONSTRAINT "FK_companies_job_package"
        FOREIGN KEY ("job_package_id") REFERENCES "job_packages"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $fk$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "FK_companies_job_package"
    `);
    await queryRunner.query(`
      ALTER TABLE "companies" DROP COLUMN IF EXISTS "job_package_expires_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "companies" DROP COLUMN IF EXISTS "job_package_id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_packages"`);
    // PostgreSQL cannot safely remove enum value 'admin' here; leave role in enum.
  }
}
