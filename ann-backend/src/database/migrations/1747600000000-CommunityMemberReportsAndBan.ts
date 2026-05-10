import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommunityMemberReportsAndBan1747600000000 implements MigrationInterface {
  name = 'CommunityMemberReportsAndBan1747600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "nurse_profiles"
      ADD COLUMN IF NOT EXISTS "community_banned_at" TIMESTAMPTZ NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "community_member_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "reporter_user_id" uuid NOT NULL,
        "reported_user_id" uuid NOT NULL,
        "reason" text NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_community_member_reports" PRIMARY KEY ("id"),
        CONSTRAINT "FK_community_report_reporter" FOREIGN KEY ("reporter_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_community_report_reported" FOREIGN KEY ("reported_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_community_report_reporter_target" UNIQUE (
          "reporter_user_id",
          "reported_user_id",
          "client_name"
        )
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_community_reports_reported_client" ON "community_member_reports" ("reported_user_id", "client_name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "community_member_reports"`);
    await queryRunner.query(`
      ALTER TABLE "nurse_profiles" DROP COLUMN IF EXISTS "community_banned_at"
    `);
  }
}
