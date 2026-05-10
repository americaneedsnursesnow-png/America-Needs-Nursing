import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Job } from './job.entity';
import { User } from './user.entity';

@Entity('saved_jobs')
export class SavedJob {
  @PrimaryColumn({ name: 'nurse_user_id', type: 'uuid' })
  nurseUserId: string;

  @PrimaryColumn({ name: 'job_id', type: 'uuid' })
  jobId: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nurse_user_id' })
  nurse: User;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;
}
