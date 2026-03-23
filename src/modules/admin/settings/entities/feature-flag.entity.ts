import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';

@Entity('feature_flags')
export class FeatureFlag extends BaseEntity {
  @Index('uq_feature_flags_key', { unique: true })
  @Column({ name: 'key', type: 'varchar', length: 150 })
  key: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_enabled', type: 'boolean', default: false })
  isEnabled: boolean;

  @Column({ name: 'rollout_percentage', type: 'int', default: 100 })
  rolloutPercentage: number;

  @Column({
    name: 'conditions',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  conditions: Record<string, unknown>;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;
}
