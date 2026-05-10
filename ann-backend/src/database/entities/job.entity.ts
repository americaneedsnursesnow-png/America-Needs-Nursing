import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from './company.entity';

export enum JobStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
}

export enum JobEmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  PER_DIEM = 'per_diem',
  TEMPORARY = 'temporary',
}

export enum JobLevel {
  INTERN = 'intern',
  ENTRY = 'entry',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  EXECUTIVE = 'executive',
}

@Entity('jobs')
@Unique(['clientName', 'slug'])
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column()
  title: string;

  @Column()
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  requirements: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  /** US state postal code, e.g. GA, TX — used for browse filters & maps. */
  @Column({ name: 'state_code', type: 'varchar', length: 2, nullable: true })
  stateCode: string | null;

  @Column({
    name: 'employment_type',
    type: 'enum',
    enum: JobEmploymentType,
    enumName: 'job_employment_type_enum',
    nullable: true,
  })
  employmentType: JobEmploymentType | null;

  @Column({
    name: 'job_level',
    type: 'enum',
    enum: JobLevel,
    enumName: 'job_level_enum',
    nullable: true,
  })
  jobLevel: JobLevel | null;

  @Column({
    name: 'job_category',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  jobCategory: string | null;

  /** Canonical band: `40-60` | `60-90` | `90-120` | `120+` — matches public job search filters. */
  @Column({
    name: 'expected_salary_range',
    type: 'varchar',
    length: 24,
    nullable: true,
  })
  expectedSalaryRange: string | null;

  @Column({
    type: 'enum',
    enum: JobStatus,
    enumName: 'job_status_enum',
    default: JobStatus.DRAFT,
  })
  status: JobStatus;

  @Column({ default: false })
  featured: boolean;

  @Column({ name: 'admin_review_required', default: false })
  adminReviewRequired: boolean;

  @Column({ name: 'approved_for_listing', default: true })
  approvedForListing: boolean;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
