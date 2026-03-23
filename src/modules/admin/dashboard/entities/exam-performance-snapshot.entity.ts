import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { ExamTemplate } from '../../exam-template/entities/exam-template.entity';

@Index(
  'uq_exam_performance_snapshots_date_template',
  ['snapshotDate', 'examTemplateId'],
  { unique: true },
)
@Entity('exam_performance_snapshots')
export class ExamPerformanceSnapshot extends BaseEntity {
  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: string;

  @Index('idx_exam_performance_snapshots_template_id')
  @Column({ name: 'exam_template_id', type: 'uuid' })
  examTemplateId: string;

  @Column({ name: 'attempts_count', type: 'int', default: 0 })
  attemptsCount: number;

  @Column({ name: 'completed_count', type: 'int', default: 0 })
  completedCount: number;

  @Column({ name: 'abandoned_count', type: 'int', default: 0 })
  abandonedCount: number;

  @Column({
    name: 'average_score',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
  })
  averageScore: string;

  @Column({
    name: 'pass_rate',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  passRate: string;

  @Column({
    name: 'avg_duration_sec',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
  })
  avgDurationSec: string;

  @Column({
    name: 'p90_duration_sec',
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  p90DurationSec: string | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => ExamTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_template_id' })
  examTemplate: ExamTemplate;
}
