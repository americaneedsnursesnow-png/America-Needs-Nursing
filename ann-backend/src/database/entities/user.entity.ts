import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export enum UserRole {
  NURSE = 'nurse',
  EMPLOYER = 'employer',
  ADMIN = 'admin',
  /** Newsletter + blog CMS only (no employer ops, packages, or directory). */
  CONTENT_ADMIN = 'content_admin',
  SUPER_ADMIN = 'super_admin',
}

@Entity('users')
@Unique(['clientName', 'email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @Column()
  email: string;

  @Column({ name: 'full_name', type: 'varchar', nullable: true })
  fullName: string | null;

  @Column({ name: 'profile_photo_url', type: 'varchar', nullable: true })
  profilePhotoUrl: string | null;

  @Column({ name: 'profile_banner_url', type: 'varchar', nullable: true })
  profileBannerUrl: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'culture_text', type: 'text', nullable: true })
  cultureText: string | null;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash: string | null;

  @Column({ type: 'enum', enum: UserRole, enumName: 'users_role_enum' })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
