import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('nurse_profiles')
export class NurseProfile {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @Column({ type: 'varchar', nullable: true })
  specialization: string | null;

  @Column({ name: 'license_number', type: 'varchar', nullable: true })
  licenseNumber: string | null;

  @Column({ name: 'years_experience', type: 'int', nullable: true })
  yearsExperience: number | null;

  @Column({ name: 'resume_url', type: 'varchar', nullable: true })
  resumeUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ name: 'state_region', type: 'varchar', nullable: true })
  stateRegion: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ name: 'license_state', type: 'varchar', nullable: true })
  licenseState: string | null;

  @Column({ type: 'text', nullable: true })
  certifications: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'culture_text', type: 'text', nullable: true })
  cultureText: string | null;

  @Column({ name: 'community_verified', default: true })
  communityVerified: boolean;

  /** When set, the nurse cannot use community (posts, comments, chat, WS). */
  @Column({ name: 'community_banned_at', type: 'timestamptz', nullable: true })
  communityBannedAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
