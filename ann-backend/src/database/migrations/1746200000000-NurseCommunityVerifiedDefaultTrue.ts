import { MigrationInterface, QueryRunner } from 'typeorm';

export class NurseCommunityVerifiedDefaultTrue1746200000000 implements MigrationInterface {
  name = 'NurseCommunityVerifiedDefaultTrue1746200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "nurse_profiles"
      ALTER COLUMN "community_verified" SET DEFAULT true
    `);
    await queryRunner.query(`
      UPDATE "nurse_profiles"
      SET "community_verified" = true
      WHERE "community_verified" = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "nurse_profiles"
      ALTER COLUMN "community_verified" SET DEFAULT false
    `);
  }
}
