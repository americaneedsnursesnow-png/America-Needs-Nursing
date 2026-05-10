import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { JobPackage } from './job-package.entity';
import { User } from './user.entity';

export enum CompanyApprovalStatus {
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('companies')
@Unique(['clientName', 'slug'])
@Unique(['employerUserId'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @Column({ name: 'employer_user_id', type: 'uuid' })
  employerUserId: string;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ name: 'logo_url', type: 'varchar', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'hero_image_url', type: 'varchar', nullable: true })
  heroImageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'contact_email', type: 'varchar', nullable: true })
  contactEmail: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', nullable: true })
  contactPhone: string | null;

  @Column({ name: 'culture_text', type: 'text', nullable: true })
  cultureText: string | null;

  @Column({ name: 'testimonials_json', type: 'jsonb', nullable: true })
  testimonialsJson: Record<string, unknown> | null;

  /**
   * Additional site / campus names for multi-location healthcare orgs
   * (e.g. `[{ "name": "Main Campus", "address": "123 St" }]`).
   */
  @Column({ name: 'locations_json', type: 'jsonb', nullable: true })
  locationsJson: Array<{
    name: string;
    address?: string | null;
  }> | null;

  @Column({
    name: 'approval_status',
    type: 'enum',
    enum: CompanyApprovalStatus,
    enumName: 'company_approval_status_enum',
    default: CompanyApprovalStatus.PENDING_REVIEW,
  })
  approvalStatus: CompanyApprovalStatus;

  /**
   * UTC `YYYYMM` of the current free-tier month window for
   * `freeTierPublishedCount` (see job publish enforcement).
   */
  @Column({ name: 'free_tier_yyyymm', type: 'varchar', length: 6, nullable: true })
  freeTierYyyymm: string | null;

  /** Publishes used in the `freeTierYyyymm` UTC month; capped in application code. */
  @Column({ name: 'free_tier_published_count', type: 'int', default: 0 })
  freeTierPublishedCount: number;

  @Column({ name: 'subscription_active', default: false })
  subscriptionActive: boolean;

  @Column({
    name: 'subscription_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  subscriptionExpiresAt: Date | null;

  @Column({ name: 'partnership_featured', default: false })
  partnershipFeatured: boolean;

  @Column({ name: 'job_package_id', type: 'uuid', nullable: true })
  jobPackageId: string | null;

  @ManyToOne(() => JobPackage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'job_package_id' })
  jobPackage: JobPackage | null;

  @Column({
    name: 'job_package_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  jobPackageExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employer_user_id' })
  employer: User;
}
