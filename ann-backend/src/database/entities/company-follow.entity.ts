import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Company } from './company.entity';
import { User } from './user.entity';

@Entity('company_follows')
export class CompanyFollow {
  @PrimaryColumn({ name: 'nurse_user_id', type: 'uuid' })
  nurseUserId: string;

  @PrimaryColumn({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nurse_user_id' })
  nurse: User;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
