import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';
import { QuestionLevel } from '@common/constants/question-bank.enum';
import { SkillTaskStatus } from '@common/constants/skill-task.enum';
import { ToeicWritingSetItem } from './toeic-writing-set-item.entity';

@Entity('toeic_writing_sets')
export class ToeicWritingSet extends BaseEntity {
  @Index('uq_toeic_writing_sets_code', { unique: true })
  @Column({ name: 'code', type: 'varchar', length: 60 })
  code: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Index('idx_toeic_writing_sets_level')
  @Column({
    name: 'level',
    type: 'enum',
    enum: QuestionLevel,
    enumName: 'question_level',
  })
  level: QuestionLevel;

  @Index('idx_toeic_writing_sets_status')
  @Column({
    name: 'status',
    type: 'enum',
    enum: SkillTaskStatus,
    enumName: 'skill_task_status',
    default: SkillTaskStatus.DRAFT,
  })
  status: SkillTaskStatus;

  @Column({ name: 'time_limit_sec', type: 'int', nullable: true })
  timeLimitSec: number | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdById: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedById: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;

  @OneToMany(() => ToeicWritingSetItem, (it) => it.set)
  items: ToeicWritingSetItem[];
}

