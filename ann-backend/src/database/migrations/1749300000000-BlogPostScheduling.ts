import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogPostScheduling1749300000000 implements MigrationInterface {
  name = 'BlogPostScheduling1749300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add scheduled_at column to blog_posts table
    await queryRunner.query(`
      ALTER TABLE "blog_posts"
      ADD COLUMN "scheduled_at" TIMESTAMPTZ NULL
    `);

    // Create index for scheduled_at for efficient querying
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_blog_posts_scheduled_at"
      ON "blog_posts" ("scheduled_at" DESC)
    `);

    // Create composite index for client and scheduled_at
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_blog_posts_client_scheduled"
      ON "blog_posts" ("client_name", "scheduled_at" DESC)
    `);

    // Add SCHEDULED status to blog_post_status_enum if not exists
    // This is done via raw query since TypeORM doesn't handle enum updates well
    await queryRunner.query(`
      ALTER TYPE "blog_post_status_enum" ADD VALUE 'scheduled' BEFORE 'published'
    `).catch(() => {
      // If the value already exists, silently ignore the error
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_blog_posts_client_scheduled"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_blog_posts_scheduled_at"`,
    );

    // Remove scheduled_at column
    await queryRunner.query(`
      ALTER TABLE "blog_posts"
      DROP COLUMN IF EXISTS "scheduled_at"
    `);

    // Note: Removing enum values in PostgreSQL is complex and typically not done in down migrations
    // The SCHEDULED value will remain in the enum
  }
}
