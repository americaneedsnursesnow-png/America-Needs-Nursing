import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommunityChatMessages1746300000000 implements MigrationInterface {
  name = 'CommunityChatMessages1746300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "community_chat_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "sender_user_id" uuid NOT NULL,
        "body" text NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_community_chat_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_community_chat_sender" FOREIGN KEY ("sender_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_community_chat_client_created" ON "community_chat_messages" ("client_name", "created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "community_chat_messages"`);
  }
}
