import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('job_packages')
export class JobPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Max concurrent published jobs when `isUnlimited` is false. */
  @Column({ name: 'published_job_limit', type: 'int' })
  publishedJobLimit: number;

  @Column({ name: 'is_unlimited', default: false })
  isUnlimited: boolean;

  @Column({ name: 'featured_job_limit', type: 'int', default: 0 })
  featuredJobLimit: number;

  /** When true, employers on this plan get directory “featured company” placement (see public featured list). */
  @Column({ name: 'featured_company_listing', default: false })
  featuredCompanyListing: boolean;

  @Column({ name: 'price_cents', type: 'int', default: 0 })
  priceCents: number;

  @Column({ type: 'varchar', length: 3, default: 'usd' })
  currency: string;

  @Column({ name: 'stripe_price_id', type: 'varchar', nullable: true })
  stripePriceId: string | null;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
