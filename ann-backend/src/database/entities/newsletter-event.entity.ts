import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NewsletterSubscriber } from './newsletter-subscriber.entity';

export enum NewsletterEventType {
  OPEN = 'open',
  CLICK = 'click',
}

@Entity('newsletter_events')
export class NewsletterEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscriber_id', type: 'uuid' })
  subscriberId: string;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: NewsletterEventType,
    enumName: 'newsletter_event_type_enum',
  })
  eventType: NewsletterEventType;

  @Column({ type: 'varchar', nullable: true })
  url: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => NewsletterSubscriber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriber_id' })
  subscriber: NewsletterSubscriber;
}
