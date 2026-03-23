import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { QuestionPart } from '@common/constants/question-bank.enum';
import { ExamAttempt } from './exam-attempt.entity';

@Entity('exam_attempt_part_scores')
@Index('uq_exam_attempt_part_scores_attempt_part', ['examAttemptId', 'part'], {
  unique: true,
})
export class ExamAttemptPartScore extends BaseEntity {
  @Index('idx_exam_attempt_part_scores_attempt_id')
  @Column({ name: 'exam_attempt_id', type: 'uuid' })
  examAttemptId: string;

  @Index('idx_exam_attempt_part_scores_part')
  @Column({
    name: 'part',
    type: 'enum',
    enum: QuestionPart,
    enumName: 'question_part',
  })
  part: QuestionPart;

  @Column({ name: 'section_order', type: 'int' })
  sectionOrder: number;

  @Column({ name: 'question_count', type: 'int', default: 0 })
  questionCount: number;

  @Column({ name: 'correct_count', type: 'int', default: 0 })
  correctCount: number;

  @Column({
    name: 'raw_score',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
  })
  rawScore: string;

  @Column({
    name: 'scaled_score',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
  })
  scaledScore: string;

  @Column({ name: 'duration_sec', type: 'int', nullable: true })
  durationSec: number | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => ExamAttempt, (examAttempt) => examAttempt.partScores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exam_attempt_id' })
  examAttempt: ExamAttempt;
}
