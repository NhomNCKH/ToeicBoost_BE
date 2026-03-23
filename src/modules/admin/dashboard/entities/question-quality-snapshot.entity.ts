import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { QuestionGroup } from '../../question-bank/entities/question-group.entity';

@Index(
  'uq_question_quality_snapshots_date_group',
  ['snapshotDate', 'questionGroupId'],
  { unique: true },
)
@Entity('question_quality_snapshots')
export class QuestionQualitySnapshot extends BaseEntity {
  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: string;

  @Index('idx_question_quality_snapshots_group_id')
  @Column({ name: 'question_group_id', type: 'uuid' })
  questionGroupId: string;

  @Column({ name: 'attempts_count', type: 'int', default: 0 })
  attemptsCount: number;

  @Column({ name: 'correct_count', type: 'int', default: 0 })
  correctCount: number;

  @Column({
    name: 'accuracy_rate',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  accuracyRate: string;

  @Column({
    name: 'avg_time_sec',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
  })
  avgTimeSec: string;

  @Column({
    name: 'discrimination_index',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  discriminationIndex: string | null;

  @Column({ name: 'flagged_count', type: 'int', default: 0 })
  flaggedCount: number;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => QuestionGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_group_id' })
  questionGroup: QuestionGroup;
}
