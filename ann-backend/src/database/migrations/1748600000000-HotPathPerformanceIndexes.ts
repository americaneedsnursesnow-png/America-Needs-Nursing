import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Read-heavy paths: public job/company lists, notifications, blog, community feed.
 * `transaction = false` + `CONCURRENTLY` avoids long locks on live tables.
 */
export class HotPathPerformanceIndexes1748600000000 implements MigrationInterface {
  name = 'HotPathPerformanceIndexes1748600000000';

  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_jobs_client_status_listing" ON "jobs" ("client_name", "status", "approved_for_listing") WHERE "status" = 'published' AND "approved_for_listing" = true`,
    );
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_jobs_company_created" ON "jobs" ("company_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_companies_client_approval" ON "companies" ("client_name", "approval_status")`,
    );
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_companies_pkg_expiry" ON "companies" ("client_name", "approval_status", "job_package_id", "job_package_expires_at") WHERE "job_package_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_ann_job_applications_nurse_client" ON "job_applications" ("nurse_user_id", "client_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_job_applications_job" ON "job_applications" ("job_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_notifications_user_read" ON "notifications" ("user_id", "read", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_blog_posts_client_status" ON "blog_posts" ("client_name", "status", "published_at" DESC NULLS LAST)`,
    );
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_community_posts_client_created" ON "community_posts" ("client_name", "created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_community_posts_client_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_blog_posts_client_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_read"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_applications_job"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ann_job_applications_nurse_client"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_companies_pkg_expiry"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_companies_client_approval"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_jobs_company_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_jobs_client_status_listing"`);
  }
}
