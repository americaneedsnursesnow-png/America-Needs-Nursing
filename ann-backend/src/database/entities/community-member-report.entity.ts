import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('community_member_reports')
@Unique('UQ_community_report_reporter_target', [
  'reporterUserId',
  'reportedUserId',
  'clientName',
])
export class CommunityMemberReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @Column({ name: 'reporter_user_id', type: 'uuid' })
  reporterUserId: string;

  @Column({ name: 'reported_user_id', type: 'uuid' })
  reportedUserId: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
