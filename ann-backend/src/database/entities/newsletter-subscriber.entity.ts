import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('newsletter_subscribers')
@Unique(['clientName', 'email'])
export class NewsletterSubscriber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @Column()
  email: string;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'unsubscribe_token', type: 'uuid' })
  unsubscribeToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
