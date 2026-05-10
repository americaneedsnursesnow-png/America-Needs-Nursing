import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NurseCommunity } from './nurse-community.entity';
import { User } from './user.entity';

@Entity('community_chat_messages')
export class CommunityChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_name' })
  clientName: string;

  /**
   * When set, message belongs to a nurse-created sub-community room.
   * Legacy rows may have `null` (global per-tenant chat).
   */
  @Column({ name: 'nurse_community_id', type: 'uuid', nullable: true })
  nurseCommunityId: string | null;

  @Column({ name: 'sender_user_id', type: 'uuid' })
  senderUserId: string;

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => NurseCommunity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'nurse_community_id' })
  nurseCommunity: NurseCommunity | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_user_id' })
  sender: User;
}
