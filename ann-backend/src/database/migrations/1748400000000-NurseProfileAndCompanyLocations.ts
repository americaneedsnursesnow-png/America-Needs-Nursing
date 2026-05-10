import { MigrationInterface, QueryRunner } from 'typeorm';

export class NurseProfileAndCompanyLocations1748400000000
  implements MigrationInterface
{
  name = 'NurseProfileAndCompanyLocations1748400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "nurse_profiles" ADD COLUMN IF NOT EXISTS "city" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "nurse_profiles" ADD COLUMN IF NOT EXISTS "state_region" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "nurse_profiles" ADD COLUMN IF NOT EXISTS "date_of_birth" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "nurse_profiles" ADD COLUMN IF NOT EXISTS "license_state" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "nurse_profiles" ADD COLUMN IF NOT EXISTS "certifications" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "locations_json" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN IF EXISTS "locations_json"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nurse_profiles" DROP COLUMN IF EXISTS "certifications"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nurse_profiles" DROP COLUMN IF EXISTS "license_state"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nurse_profiles" DROP COLUMN IF EXISTS "date_of_birth"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nurse_profiles" DROP COLUMN IF EXISTS "state_region"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nurse_profiles" DROP COLUMN IF EXISTS "city"`,
    );
  }
}
