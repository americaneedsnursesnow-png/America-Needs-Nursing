import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum BlogPostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity('blog_posts')
@Unique(['clientName', 'slug'])
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @Column()
  title: string;

  @Column()
  slug: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'cover_image_url', type: 'varchar', nullable: true })
  coverImageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ name: 'meta_title', type: 'varchar', nullable: true })
  metaTitle: string | null;

  @Column({ name: 'meta_description', type: 'varchar', nullable: true })
  metaDescription: string | null;

  @Column({ default: false })
  sponsored: boolean;

  @Column({
    type: 'enum',
    enum: BlogPostStatus,
    enumName: 'blog_post_status_enum',
    default: BlogPostStatus.DRAFT,
  })
  status: BlogPostStatus;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
