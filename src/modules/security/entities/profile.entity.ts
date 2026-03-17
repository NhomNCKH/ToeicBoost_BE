import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from './user.entity';

@Entity('profiles')
export class Profile extends BaseEntity {
  @Column({ name: 'target_score', type: 'int', nullable: true })
  targetScore: number | null;

  @Column({ name: 'deadline', type: 'date', nullable: true })
  deadline: Date | null;

  @Column({ name: 'current_level', type: 'varchar', nullable: true })
  currentLevel: string | null;

  @Column({ name: 'estimated_score', type: 'int', nullable: true })
  estimatedScore: number | null;

  @Column({ name: 'study_slots', type: 'jsonb', nullable: true })
  studySlots: Record<string, unknown> | null;

  @Column({ name: 'daily_study_minutes', type: 'int', nullable: true })
  dailyStudyMinutes: number | null;

  @Column({ name: 'reason', type: 'varchar', nullable: true })
  reason: string | null;

  @Column({ name: 'did', type: 'varchar', nullable: true })
  did: string | null;

  @Column({ name: 'wallet_address', type: 'varchar', nullable: true })
  walletAddress: string | null;

  @Column({ name: 'did_private_key_enc', type: 'text', nullable: true })
  didPrivateKeyEnc: string | null;

  @OneToOne(() => User, (user) => user.profile, { cascade: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
