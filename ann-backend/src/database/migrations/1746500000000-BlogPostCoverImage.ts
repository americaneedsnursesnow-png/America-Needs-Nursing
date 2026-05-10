import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogPostCoverImage1746500000000 implements MigrationInterface {
  name = 'BlogPostCoverImage1746500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "cover_image_url" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "cover_image_url"
    `);
  }
}
