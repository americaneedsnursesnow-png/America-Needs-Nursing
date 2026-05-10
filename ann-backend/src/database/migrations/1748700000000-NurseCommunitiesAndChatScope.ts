import { MigrationInterface, QueryRunner } from 'typeorm';

export class NurseCommunitiesAndChatScope1748700000000
  implements MigrationInterface
{
  name = 'NurseCommunitiesAndChatScope1748700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "nurse_communities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "creator_user_id" uuid NOT NULL,
        "name" character varying(120) NOT NULL,
        "description" text NOT NULL,
        "rules" text NOT NULL,
        "image_url" character varying(2048),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nurse_communities" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_nurse_communities_client_creator" UNIQUE ("client_name", "creator_user_id"),
        CONSTRAINT "FK_nurse_communities_creator" FOREIGN KEY ("creator_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_nurse_communities_client" ON "nurse_communities" ("client_name")`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "nurse_community_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "community_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nurse_community_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_nurse_community_members_community_user" UNIQUE ("community_id", "user_id"),
        CONSTRAINT "FK_nmc_community" FOREIGN KEY ("community_id")
          REFERENCES "nurse_communities"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_nmc_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_nmc_user" ON "nurse_community_members" ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "community_chat_messages" ADD COLUMN IF NOT EXISTS "nurse_community_id" uuid`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_community_chat_nurse_community'
        ) THEN
          ALTER TABLE "community_chat_messages"
            ADD CONSTRAINT "FK_community_chat_nurse_community"
            FOREIGN KEY ("nurse_community_id") REFERENCES "nurse_communities"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_community_chat_nurse_community_created" ON "community_chat_messages" ("nurse_community_id", "created_at" DESC) WHERE "nurse_community_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "community_chat_messages" DROP CONSTRAINT IF EXISTS "FK_community_chat_nurse_community"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_community_chat_nurse_community_created"`,
    );
    await queryRunner.query(
      `ALTER TABLE "community_chat_messages" DROP COLUMN IF EXISTS "nurse_community_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "nurse_community_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "nurse_communities"`);
  }
}
