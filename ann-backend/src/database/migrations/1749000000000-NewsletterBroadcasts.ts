import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewsletterBroadcasts1749000000000
  implements MigrationInterface
{
  name = 'NewsletterBroadcasts1749000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "newsletter_broadcasts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "subject" character varying(200) NOT NULL,
        "html" text NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'pending',
        "scheduled_at" TIMESTAMPTZ NOT NULL,
        "sent_at" TIMESTAMPTZ,
        "recipient_count" integer,
        "failure_reason" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_newsletter_broadcasts" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_newsletter_broadcasts_client_scheduled"
      ON "newsletter_broadcasts" ("client_name", "scheduled_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_newsletter_broadcasts_client_scheduled"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_broadcasts"`);
  }
}
