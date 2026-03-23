import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';
import { SettingDataType } from '@common/constants/settings.enum';

@Entity('system_settings')
export class SystemSetting extends BaseEntity {
  @Index('uq_system_settings_key', { unique: true })
  @Column({ name: 'key', type: 'varchar', length: 150 })
  key: string;

  @Index('idx_system_settings_group_name')
  @Column({ name: 'group_name', type: 'varchar', length: 100 })
  groupName: string;

  @Column({
    name: 'data_type',
    type: 'enum',
    enum: SettingDataType,
    enumName: 'setting_data_type',
  })
  dataType: SettingDataType;

  @Column({ name: 'value_json', type: 'jsonb', default: () => "'{}'::jsonb" })
  valueJson: Record<string, unknown>;

  @Column({ name: 'is_secret', type: 'boolean', default: false })
  isSecret: boolean;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;
}
