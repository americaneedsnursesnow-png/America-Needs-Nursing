import { MigrationInterface, QueryRunner } from 'typeorm';

export class AnnPlatformSchema1744050000000 implements MigrationInterface {
  name = 'AnnPlatformSchema1744050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" character varying
    `);

    await queryRunner.query(`
      DO $enum$ BEGIN
        CREATE TYPE "public"."company_approval_status_enum" AS ENUM(
          'pending_review', 'approved', 'rejected'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $enum$
    `);
    await queryRunner.query(`
      DO $enum$ BEGIN
        CREATE TYPE "public"."job_status_enum" AS ENUM('draft', 'published', 'closed');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $enum$
    `);
    await queryRunner.query(`
      DO $enum$ BEGIN
        CREATE TYPE "public"."application_status_enum" AS ENUM(
          'pending', 'reviewed', 'accepted', 'rejected'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $enum$
    `);
    await queryRunner.query(`
      DO $enum$ BEGIN
        CREATE TYPE "public"."blog_post_status_enum" AS ENUM('draft', 'published');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $enum$
    `);
    await queryRunner.query(`
      DO $enum$ BEGIN
        CREATE TYPE "public"."newsletter_event_type_enum" AS ENUM('open', 'click');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $enum$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "nurse_profiles" (
        "user_id" uuid NOT NULL,
        "client_name" character varying NOT NULL,
        "specialization" character varying,
        "license_number" character varying,
        "years_experience" integer,
        "resume_url" character varying,
        "community_verified" boolean NOT NULL DEFAULT false,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nurse_profiles" PRIMARY KEY ("user_id"),
        CONSTRAINT "FK_nurse_profiles_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "companies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "employer_user_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "logo_url" character varying,
        "hero_image_url" character varying,
        "description" text,
        "contact_email" character varying,
        "contact_phone" character varying,
        "culture_text" text,
        "testimonials_json" jsonb,
        "approval_status" "public"."company_approval_status_enum" NOT NULL DEFAULT 'pending_review',
        "free_job_consumed" boolean NOT NULL DEFAULT false,
        "subscription_active" boolean NOT NULL DEFAULT false,
        "subscription_expires_at" TIMESTAMPTZ,
        "partnership_featured" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_companies" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_companies_employer_user" UNIQUE ("employer_user_id"),
        CONSTRAINT "UQ_companies_client_slug" UNIQUE ("client_name", "slug"),
        CONSTRAINT "FK_companies_employer" FOREIGN KEY ("employer_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "company_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" text NOT NULL,
        "requirements" text,
        "location" character varying,
        "status" "public"."job_status_enum" NOT NULL DEFAULT 'draft',
        "featured" boolean NOT NULL DEFAULT false,
        "admin_review_required" boolean NOT NULL DEFAULT false,
        "approved_for_listing" boolean NOT NULL DEFAULT true,
        "expires_at" TIMESTAMPTZ,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jobs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_jobs_client_slug" UNIQUE ("client_name", "slug"),
        CONSTRAINT "FK_jobs_company" FOREIGN KEY ("company_id")
          REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jobs_company" ON "jobs" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jobs_listing" ON "jobs" ("status", "approved_for_listing")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_applications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "job_id" uuid NOT NULL,
        "nurse_user_id" uuid NOT NULL,
        "status" "public"."application_status_enum" NOT NULL DEFAULT 'pending',
        "cover_letter" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_job_applications" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_job_applications_job_nurse" UNIQUE ("job_id", "nurse_user_id"),
        CONSTRAINT "FK_job_applications_job" FOREIGN KEY ("job_id")
          REFERENCES "jobs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_job_applications_nurse" FOREIGN KEY ("nurse_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_job_applications_nurse" ON "job_applications" ("nurse_user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "saved_jobs" (
        "nurse_user_id" uuid NOT NULL,
        "job_id" uuid NOT NULL,
        "client_name" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_saved_jobs" PRIMARY KEY ("nurse_user_id", "job_id"),
        CONSTRAINT "FK_saved_jobs_nurse" FOREIGN KEY ("nurse_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_saved_jobs_job" FOREIGN KEY ("job_id")
          REFERENCES "jobs"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_follows" (
        "nurse_user_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "client_name" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_follows" PRIMARY KEY ("nurse_user_id", "company_id"),
        CONSTRAINT "FK_company_follows_nurse" FOREIGN KEY ("nurse_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_company_follows_company" FOREIGN KEY ("company_id")
          REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "application_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_conversations_application" UNIQUE ("application_id"),
        CONSTRAINT "FK_conversations_application" FOREIGN KEY ("application_id")
          REFERENCES "job_applications"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL,
        "sender_user_id" uuid NOT NULL,
        "body" text NOT NULL,
        "read_at" TIMESTAMPTZ,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversation_id")
          REFERENCES "conversations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_sender" FOREIGN KEY ("sender_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messages_conversation" ON "messages" ("conversation_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "title" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "body" text NOT NULL,
        "excerpt" text,
        "meta_title" character varying,
        "meta_description" character varying,
        "sponsored" boolean NOT NULL DEFAULT false,
        "status" "public"."blog_post_status_enum" NOT NULL DEFAULT 'draft',
        "published_at" TIMESTAMPTZ,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blog_posts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_blog_posts_client_slug" UNIQUE ("client_name", "slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "unsubscribe_token" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_newsletter_subscribers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_newsletter_subscribers_client_email" UNIQUE ("client_name", "email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "newsletter_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscriber_id" uuid NOT NULL,
        "event_type" "public"."newsletter_event_type_enum" NOT NULL,
        "url" character varying,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_newsletter_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_newsletter_events_subscriber" FOREIGN KEY ("subscriber_id")
          REFERENCES "newsletter_subscribers"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "community_posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "author_user_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "body" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_community_posts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_community_posts_author" FOREIGN KEY ("author_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "community_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "post_id" uuid NOT NULL,
        "author_user_id" uuid NOT NULL,
        "body" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_community_comments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_community_comments_post" FOREIGN KEY ("post_id")
          REFERENCES "community_posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_community_comments_author" FOREIGN KEY ("author_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "user_id" uuid NOT NULL,
        "type" character varying NOT NULL,
        "title" character varying NOT NULL,
        "body" text,
        "read" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_user" ON "notifications" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "nurse_database_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_name" character varying NOT NULL,
        "data" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nurse_database_records" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "nurse_database_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "community_comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "community_posts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_subscribers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blog_posts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_follows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "saved_jobs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_applications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "jobs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "nurse_profiles"`);

    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."newsletter_event_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."blog_post_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."application_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."job_status_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."company_approval_status_enum"`,
    );

    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash"
    `);
  }
}
