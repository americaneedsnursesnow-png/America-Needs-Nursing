import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { NurseCommunityMember } from './nurse-community-member.entity';

@Entity('nurse_communities')
@Unique(['clientName', 'creatorUserId'])
export class NurseCommunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @Column({ name: 'creator_user_id', type: 'uuid' })
  creatorUserId: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  rules: string;

  @Column({ name: 'image_url', type: 'varchar', length: 2048, nullable: true })
  imageUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_user_id' })
  creator: User;

  @OneToMany(() => NurseCommunityMember, (m) => m.community)
  members: NurseCommunityMember[];
}
