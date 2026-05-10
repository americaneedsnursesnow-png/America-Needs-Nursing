import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { NurseCommunity } from './nurse-community.entity';

@Entity('nurse_community_members')
@Unique(['communityId', 'userId'])
export class NurseCommunityMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'community_id', type: 'uuid' })
  communityId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @ManyToOne(() => NurseCommunity, (c) => c.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'community_id' })
  community: NurseCommunity;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
