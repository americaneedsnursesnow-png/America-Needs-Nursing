import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  /**
   * How many free job publishes a company can make per UTC month when they have
   * no active job package and no named subscription (`subscription_plan_name`).
   * Edited by staff via `PATCH /clients/platform-settings`.
   */
  @Column({
    name: 'free_tier_job_posts_per_month',
    type: 'int',
    default: 5,
  })
  freeTierJobPostsPerMonth: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
