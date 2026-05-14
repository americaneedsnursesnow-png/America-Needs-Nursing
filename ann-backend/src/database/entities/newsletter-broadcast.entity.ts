import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NewsletterBroadcastStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('newsletter_broadcasts')
@Index(['clientName', 'scheduledAt'])
export class NewsletterBroadcast {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @Column({ length: 200 })
  subject: string;

  @Column({ type: 'text' })
  html: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: NewsletterBroadcastStatus.PENDING,
  })
  status: NewsletterBroadcastStatus;

  /** When the send is scheduled to run (UTC). */
  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'recipient_count', type: 'int', nullable: true })
  recipientCount: number | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
